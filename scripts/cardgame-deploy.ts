import * as fs from "node:fs";
import {
  createBuildEnvironment,
  loadSettings,
  readJsonObject,
  removeDirectory,
  resolveChildPath,
  runCommand,
  withLock,
} from "$scripts/shared";
import { parseArgs } from "node:util";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

export type CardgameDeployment = {
  gameRemote: string;
  receiver: string;
  siteConfig: string;
  siteRemote: string;
};

export const readCardgameConfig = (filename: string): CardgameDeployment => {
  const value = readJsonObject(filename);
  const readString = (key: string): string => {
    const entry = value[key];
    if (typeof entry !== "string" || !entry) {
      throw new Error(`Invalid cardgame deployment setting: ${key}. Run deploy:cardgame:setup.`);
    }
    return entry;
  };
  return {
    gameRemote: readString("gameRemote"),
    receiver: readString("receiver"),
    siteConfig: readString("siteConfig"),
    siteRemote: readString("siteRemote"),
  };
};

/** Only updates to main trigger deployment. Reject deletion and malformed hook input. */
export const pushedMain = (input: string): string | undefined => {
  let main: string | undefined;
  for (const line of input.trim().split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }
    const fields = line.trim().split(/\s+/);
    if (fields.length !== 3) {
      throw new Error("Invalid receive-hook input.");
    }
    const [, revision, ref] = fields;
    if (ref !== "refs/heads/main") {
      continue;
    }
    if (!/^[a-f0-9]{40}$/.test(revision) || /^0+$/.test(revision) || main) {
      throw new Error("Invalid or deleted cardgame main revision.");
    }
    main = revision;
  }
  return main;
};

export const updateGamePin = (git: string, directory: string, gameRevision: string): string => {
  const options = { capture: true, cwd: directory };
  const parent = runCommand(git, ["rev-parse", "HEAD"], options);
  const entry = runCommand(git, ["ls-tree", "HEAD", "--", "vendor/cardgame"], options);
  if (!entry.startsWith("160000 commit ")) {
    throw new Error("The homepage main branch does not contain the cardgame submodule.");
  }
  if (entry.split(/\s+/)[2] === gameRevision) {
    return parent;
  }
  if (!/^[a-f0-9]{40}$/.test(gameRevision)) {
    throw new Error("Invalid game commit ID.");
  }
  // This index belongs to an isolated clone; no developer working tree is changed.
  runCommand(git, ["read-tree", "HEAD"], options);
  runCommand(
    git,
    ["update-index", "--cacheinfo", `160000,${gameRevision},vendor/cardgame`],
    options,
  );
  const tree = runCommand(git, ["write-tree"], options);
  return runCommand(
    git,
    [
      "-c",
      "user.name=Cardgame deployment",
      "-c",
      "user.email=cardgame-deploy@users.noreply.github.com",
      "commit-tree",
      tree,
      "-p",
      parent,
      "-m",
      `chore: update cardgame to ${gameRevision.slice(0, 7)}`,
      "-m",
      `Automatically pin cardgame-lit/main at ${gameRevision} after a local push.`,
    ],
    options,
  );
};

const remoteMain = (git: string, remote: string): string => {
  const result = runCommand(git, ["ls-remote", "--exit-code", remote, "refs/heads/main"], {
    capture: true,
  });
  const revision = result.split(/\s+/)[0];
  if (!/^[a-f0-9]{40}$/.test(revision)) {
    throw new Error(`Cannot resolve main for ${remote}.`);
  }
  return revision;
};

const verifyDeployment = (config: CardgameDeployment, revision: string): void => {
  const site = loadSettings(config.siteConfig);
  const receipt = resolveChildPath(site.receiver, "last-deployment.json");
  const deployed = (): boolean =>
    fs.existsSync(receipt) && readJsonObject(receipt).revision === revision;
  if (!deployed()) {
    // A previous post-receive failure can leave the ref current but the files old.
    runCommand(site.bun, [
      resolve(__dirname, "run.ts"),
      "deploy",
      "--mode",
      "retry",
      "--config",
      config.siteConfig,
    ]);
  }
  if (!deployed()) {
    throw new Error("The requested homepage revision was not deployed. Retry deploy:cardgame.");
  }
};

export const deployCardgame = (config: CardgameDeployment, requested?: string): void => {
  const site = loadSettings(config.siteConfig);
  withLock(site.cache, "cardgame.running", () => {
    const gameRevision = remoteMain(site.git, config.gameRemote);
    if (requested && requested !== gameRevision) {
      console.log("A newer cardgame main is on GitHub; deploying its current revision.");
    }
    const workName = `cardgame-update-${randomUUID()}`;
    const work = resolveChildPath(site.cache, workName);
    let complete = false;
    try {
      runCommand(site.git, [
        "clone",
        "--no-checkout",
        "--branch",
        "main",
        "--single-branch",
        "--",
        config.siteRemote,
        work,
      ]);
      const revision = updateGamePin(site.git, work, gameRevision);
      const options = { cwd: work };
      // Normal fast-forward pushes reject concurrent parent edits rather than overwriting them.
      runCommand(site.git, ["push", "origin", `${revision}:refs/heads/main`], options);
      runCommand(site.git, ["push", site.receiver, `${revision}:refs/heads/main`], options);
      verifyDeployment(config, revision);
      complete = true;
      console.log(`Domus now includes cardgame ${gameRevision}. Homepage commit: ${revision}.`);
    } finally {
      if (complete) {
        removeDirectory(site.cache, workName);
      } else {
        console.error(
          `Deployment diagnostics retained in ${work}. Retry with bun run deploy:cardgame in arcada-home.`,
        );
      }
    }
  });
};

export const main = (): void => {
  const { values } = parseArgs({
    options: {
      config: { type: "string" },
      mode: { default: "retry", type: "string" },
    },
  });
  if (!["pre-receive", "post-receive", "retry"].includes(values.mode)) {
    throw new Error("Invalid cardgame deployment mode.");
  }
  // Hooks export repository-specific Git variables. All following Git work uses other repos.
  process.env = createBuildEnvironment(process.execPath);
  const filename =
    values.config ??
    runCommand("git", ["config", "--get", "arcada.cardgameDeployConfig"], { capture: true });
  const config = readCardgameConfig(filename);
  if (values.mode === "retry") {
    deployCardgame(config);
    return;
  }
  const revision = pushedMain(fs.readFileSync(0, "utf8"));
  if (!revision) {
    return;
  }
  if (values.mode === "pre-receive") {
    const site = loadSettings(config.siteConfig);
    if (remoteMain(site.git, config.gameRemote) !== revision) {
      throw new Error("Push cardgame main to GitHub successfully before pushing it to Domus.");
    }
    return;
  }
  deployCardgame(config, revision);
};
