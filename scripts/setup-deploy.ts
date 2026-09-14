import * as fs from "node:fs";
import * as path from "node:path";
import {
  type DeploymentSettings,
  assertNoSymlinks,
  copyDirectory,
  copyFile,
  createBuildEnvironment,
  readJsonObject,
  resolveChildPath,
  runCommand,
  withLock,
  writeJson,
} from "$scripts/shared";
import { createHash, randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { parseArgs } from "node:util";

const CACHE_HASH_LENGTH = 12;
const EXECUTABLE_PERMISSIONS = 0o755;
const repository = path.resolve(__dirname, "..");

/** Git resolves mapped drives to UNC paths before checking repository ownership. */
export const trustReceiver = (git: string, receiver: string): void => {
  assertNoSymlinks(receiver);
  const actual = fs.realpathSync.native(receiver).replaceAll("\\", "/");
  const trusted = actual.startsWith("//") ? `%(prefix)/${actual}` : actual;
  let existing: string[] = [];
  try {
    existing = runCommand(git, ["config", "--global", "--get-all", "safe.directory"], {
      capture: true,
    }).split(/\r?\n/);
  } catch {
    // A Git config query exits with 1 when no values have been configured yet.
  }
  if (!existing.includes(trusted)) {
    runCommand(git, ["config", "--global", "--add", "safe.directory", trusted]);
  }
};

const findExecutable = (name: string): string =>
  runCommand("where.exe", [name], { capture: true }).split(/\r?\n/)[0];

export const quoteHookPath = (value: string): string => {
  if (/['\r\n]/.test(value)) {
    throw new Error("Hook paths must not contain apostrophes or newlines.");
  }
  return `'${value.replaceAll("\\", "/")}'`;
};

const createSettings = (receiver: string, target: string): DeploymentSettings => {
  const receiverPath = receiver.toLowerCase();
  const publicPath = target.toLowerCase();
  if (receiverPath === publicPath || receiverPath.startsWith(publicPath + path.sep)) {
    throw new Error("The Git receiver must be outside the public html directory.");
  }
  assertNoSymlinks(receiver);
  assertNoSymlinks(target);
  const git = findExecutable("git.exe");
  runCommand(git, ["-C", repository, "rev-parse", "--absolute-git-dir"], { capture: true });
  const cacheId = createHash("sha256")
    .update(receiverPath)
    .digest("hex")
    .slice(0, CACHE_HASH_LENGTH)
    .toUpperCase();
  return {
    bun: process.execPath,
    cache: path.join(homedir(), "Documents", "Codex", "arcada-home-deploy", cacheId),
    git,
    receiver,
    tar: findExecutable("tar.exe"),
    target,
  };
};

const readOtherPushUrls = ({ git, receiver }: DeploymentSettings): string[] => {
  const output = runCommand(
    git,
    ["-C", repository, "remote", "get-url", "--push", "--all", "origin"],
    {
      capture: true,
    },
  );
  const receiverUrl = receiver.replaceAll("\\", "/").toLowerCase();
  const urls = output.split(/\r?\n/).filter((url) => {
    const isLegacyDeployDrive = /^H:[\\/]?$/i.test(url);
    const isReceiver = url.replaceAll("\\", "/").toLowerCase() === receiverUrl;
    return !isLegacyDeployDrive && !isReceiver;
  });
  if (!urls.length) {
    throw new Error("Origin must have a non-deployment push URL.");
  }
  return urls;
};

const prepareReceiver = (settings: DeploymentSettings, config: string): void => {
  if (fs.existsSync(settings.receiver)) {
    if (!fs.existsSync(config)) {
      throw new Error("Receiver already exists and is not managed by this setup script.");
    }
    return;
  }
  runCommand(settings.git, ["init", "--bare", "--initial-branch=main", settings.receiver]);
  // Mark a new receiver immediately so an interrupted first setup can be retried.
  writeJson(config, settings);
};

export const installTooling = ({ bun, cache }: DeploymentSettings): string => {
  const tooling = resolveChildPath(cache, `tooling-${randomUUID()}`);
  fs.mkdirSync(tooling, { recursive: true });

  // Keep hooks independent of the checkout, using the same dependency versions.
  const manifest = readJsonObject(resolveChildPath(repository, "package.json"));
  writeJson(resolveChildPath(tooling, "package.json"), { ...manifest, scripts: {} });
  copyFile(resolveChildPath(repository, "bun.lock"), resolveChildPath(tooling, "bun.lock"));
  copyFile(
    resolveChildPath(repository, "tsconfig.paths.json"),
    resolveChildPath(tooling, "tsconfig.paths.json"),
  );
  copyDirectory(__dirname, resolveChildPath(tooling, "scripts"));

  const options = { cwd: tooling, env: createBuildEnvironment(bun) };
  runCommand(bun, ["install", "--frozen-lockfile", "--ignore-scripts"] as const, options);
  runCommand(
    bun,
    ["--bun", "tsc", "--project", "scripts/tsconfig.json", "--noEmit"] as const,
    options,
  );
  return resolveChildPath(tooling, "scripts/run.ts");
};

const installHooks = (settings: DeploymentSettings, config: string, runner: string): void => {
  const command = `${quoteHookPath(settings.bun)} ${quoteHookPath(runner)} deploy`;
  const configArgument = `--config ${quoteHookPath(config)}`;
  writeJson(config, settings);
  for (const mode of ["pre-receive", "post-receive"] as const) {
    const hook = resolveChildPath(settings.receiver, `hooks/${mode}`);
    const content = `#!/bin/sh\nexec ${command} --mode ${mode} ${configArgument}\n`;
    assertNoSymlinks(hook);
    fs.writeFileSync(hook, content, { mode: EXECUTABLE_PERMISSIONS });
  }
  const legacyHook = resolveChildPath(settings.receiver, "hooks/arcada-deploy.ps1");
  assertNoSymlinks(legacyHook);
  if (fs.existsSync(legacyHook)) {
    fs.unlinkSync(legacyHook);
  }
};

const configureReceiver = ({ git, receiver }: DeploymentSettings, config: string): void => {
  const gitSettings = {
    "core.fsmonitor": "false",
    "receive.denyDeletes": "true",
    "receive.denyNonFastForwards": "true",
  };
  for (const [key, value] of Object.entries(gitSettings)) {
    runCommand(git, [`--git-dir=${receiver}`, "config", key, value]);
  }
  runCommand(git, ["-C", repository, "config", "arcada.deployConfig", config]);
};

const configureRemotes = ({ git, receiver }: DeploymentSettings, pushUrls: string[]): void => {
  const receiverUrl = receiver.replaceAll("\\", "/");
  runCommand(git, [
    "-C",
    repository,
    "config",
    "--replace-all",
    "remote.origin.pushurl",
    pushUrls[0],
  ]);
  for (const url of [...pushUrls.slice(1), receiverUrl]) {
    runCommand(git, ["-C", repository, "config", "--add", "remote.origin.pushurl", url]);
  }
  const remotes = runCommand(git, ["-C", repository, "remote"], { capture: true }).split(/\r?\n/);
  const operation = remotes.includes("domus") ? "set-url" : "add";
  runCommand(git, ["-C", repository, "remote", operation, "domus", receiverUrl]);
};

export const main = (): void => {
  const { values } = parseArgs({
    options: {
      "no-remote-changes": { default: false, type: "boolean" },
      receiver: { default: "H:\\.arcada-home-deploy.git", type: "string" },
      target: { default: "H:\\html", type: "string" },
    },
  });
  const settings = createSettings(path.resolve(values.receiver), path.resolve(values.target));
  const config = resolveChildPath(settings.receiver, "hooks/arcada-deploy.json");
  const updateRemotes = !values["no-remote-changes"];
  const pushUrls = updateRemotes ? readOtherPushUrls(settings) : [];

  prepareReceiver(settings, config);
  trustReceiver(settings.git, settings.receiver);
  withLock(settings.cache, "setup.running", () => {
    const runner = installTooling(settings);
    installHooks(settings, config, runner);
    configureReceiver(settings, config);
    if (updateRemotes) {
      configureRemotes(settings, pushUrls);
    }
    console.log(
      `Configured Bun/ts-node main-push deployment: ${settings.receiver} -> ${settings.target}`,
    );
  });
};
