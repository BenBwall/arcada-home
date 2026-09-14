import * as fs from "node:fs";
import {
  type DeploymentSettings,
  createBuildEnvironment,
  listFiles,
  resolveChildPath,
  runCommand,
} from "$scripts/shared";

/** Git archive leaves gitlinks empty. Export each pinned commit, never its branch tip. */
export const exportSubmodules = (
  settings: DeploymentSettings,
  revision: string,
  source: string,
  work: string,
  environment?: NodeJS.ProcessEnv,
): void => {
  // Read the parent tree with the quarantine environment still intact.
  const tree = runCommand(
    settings.git,
    [`--git-dir=${settings.receiver}`, "ls-tree", "-r", "-z", revision],
    { capture: true, env: environment },
  );
  const links = tree.split("\0").filter((entry) => entry.startsWith("160000 commit "));
  const options = { env: createBuildEnvironment(settings.bun) };
  for (const [index, entry] of links.entries()) {
    const match = /^160000 commit ([a-f0-9]+)\t(.+)$/.exec(entry);
    if (!match) {
      throw new Error("Invalid submodule tree entry.");
    }
    const [, commit, subpath] = match;
    const destination = resolveChildPath(source, subpath);
    const config = resolveChildPath(source, ".gitmodules");
    const paths = runCommand(
      settings.git,
      ["config", "--file", config, "--get-regexp", "^submodule\\..*\\.path$"],
      { ...options, capture: true },
    );
    const key = paths
      .split(/\r?\n/)
      .find((line) => line.slice(line.indexOf(" ") + 1) === subpath)
      ?.split(" ")[0];
    if (!key) {
      throw new Error(`Missing submodule configuration for ${subpath}.`);
    }
    const url = runCommand(
      settings.git,
      ["config", "--file", config, "--get", key.replace(/\.path$/, ".url")],
      { ...options, capture: true },
    );
    if (!url.startsWith("https://")) {
      throw new Error(`Deployment requires a public HTTPS submodule URL: ${subpath}.`);
    }
    const repository = resolveChildPath(work, `submodule-${index}`);
    const archive = resolveChildPath(work, `submodule-${index}.tar`);
    runCommand(settings.git, ["clone", "--bare", "--", url, repository], options);
    runCommand(
      settings.git,
      [`--git-dir=${repository}`, "archive", "--format=tar", `--output=${archive}`, commit],
      options,
    );
    fs.mkdirSync(destination, { recursive: true });
    runCommand(settings.tar, ["-xf", archive, "-C", destination], options);
    listFiles(destination);
    // Recurse against the archived commit and its own .gitmodules, if it has any.
    exportSubmodules(
      { ...settings, receiver: repository },
      commit,
      destination,
      repository,
      options.env,
    );
  }
};
