import * as fs from "node:fs";
import {
  assertNoSymlinks,
  loadSettings,
  resolveChildPath,
  runCommand,
  withLock,
  writeJson,
} from "$scripts/shared";
import { installTooling, quoteHookPath, trustReceiver } from "$scripts/setup-deploy";
import { parseArgs } from "node:util";
import { resolve } from "node:path";

const repository = resolve(__dirname, "..");
const EXECUTABLE_PERMISSIONS = 0o755;
const GAME_REMOTE = "https://github.com/BenBwall/cardgame-lit.git";
const SITE_REMOTE = "git@github.com:BenBwall/arcada-home.git";

const configureCheckout = (
  git: string,
  checkout: string,
  receiver: string,
  config: string,
): void => {
  const source = runCommand(git, ["-C", checkout, "remote", "get-url", "origin"], {
    capture: true,
  });
  if (
    !/^(?:https:\/\/github\.com\/|git@github\.com:)BenBwall\/cardgame-lit(?:\.git)?$/.test(source)
  ) {
    throw new Error(`Not a BenBwall/cardgame-lit checkout: ${checkout}.`);
  }
  const args = ["-C", checkout];
  runCommand(git, [...args, "config", "--replace-all", "remote.origin.pushurl", source]);
  runCommand(git, [
    ...args,
    "config",
    "--add",
    "remote.origin.pushurl",
    receiver.replaceAll("\\", "/"),
  ]);
  const remotes = runCommand(git, [...args, "remote"], { capture: true }).split(/\r?\n/);
  runCommand(git, [
    ...args,
    "remote",
    remotes.includes("domus") ? "set-url" : "add",
    "domus",
    receiver,
  ]);
  runCommand(git, [...args, "config", "arcada.cardgameDeployConfig", config]);
};

export const main = (): void => {
  const { values } = parseArgs({
    options: {
      checkout: { default: resolve(repository, "../cardgame-lit"), type: "string" },
      receiver: { default: "H:\\.cardgame-lit-deploy.git", type: "string" },
    },
  });
  const siteConfig = runCommand(
    "git",
    ["-C", repository, "config", "--get", "arcada.deployConfig"],
    { capture: true },
  );
  const site = loadSettings(siteConfig);
  const receiver = resolve(values.receiver);
  const config = resolveChildPath(receiver, "hooks/cardgame-deploy.json");
  assertNoSymlinks(receiver);
  if (receiver.toLowerCase().startsWith(site.target.toLowerCase()) || receiver === site.receiver) {
    throw new Error(
      "The cardgame receiver must be separate from the public site and site receiver.",
    );
  }
  if (fs.existsSync(receiver) && !fs.existsSync(config)) {
    throw new Error(
      "The proposed cardgame receiver already exists and is not managed by this setup.",
    );
  }
  if (!fs.existsSync(receiver)) {
    runCommand(site.git, ["init", "--bare", "--initial-branch=main", receiver]);
    // Mark ownership before installing dependencies so an interrupted setup can be retried.
    writeJson(config, { gameRemote: GAME_REMOTE, receiver, siteConfig, siteRemote: SITE_REMOTE });
  }
  trustReceiver(site.git, site.receiver);
  trustReceiver(site.git, receiver);
  withLock(site.cache, "setup.running", () => {
    const runner = installTooling(site);
    writeJson(config, { gameRemote: GAME_REMOTE, receiver, siteConfig, siteRemote: SITE_REMOTE });
    for (const mode of ["pre-receive", "post-receive"]) {
      const hook = resolveChildPath(receiver, `hooks/${mode}`);
      assertNoSymlinks(hook);
      fs.writeFileSync(
        hook,
        `#!/bin/sh\nexec ${quoteHookPath(site.bun)} ${quoteHookPath(runner)} cardgame-deploy --mode ${mode} --config ${quoteHookPath(config)}\n`,
        { mode: EXECUTABLE_PERMISSIONS },
      );
    }
    for (const [key, value] of Object.entries({
      "core.fsmonitor": "false",
      "receive.denyDeletes": "true",
      "receive.denyNonFastForwards": "true",
    })) {
      runCommand(site.git, [`--git-dir=${receiver}`, "config", key, value]);
    }
    for (const checkout of [resolve(values.checkout), resolve(repository, "vendor/cardgame")]) {
      configureCheckout(site.git, checkout, receiver, config);
    }
    runCommand(site.git, ["-C", repository, "config", "arcada.cardgameDeployConfig", config]);
    console.log(`Cardgame main pushes from both local checkouts now update Domus via ${receiver}.`);
  });
};
