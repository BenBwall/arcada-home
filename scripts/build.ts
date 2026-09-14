import * as fs from "node:fs";
import {
  type DeploymentSettings,
  copyDirectory,
  createBuildEnvironment,
  listFiles,
  removeDirectory,
  resolveChildPath,
  runCommand,
  withLock,
} from "$scripts/shared";
import { exportSubmodules } from "$scripts/submodules";
import { randomUUID } from "node:crypto";

export const exportRevision = (
  settings: DeploymentSettings,
  revision: string,
  work: string,
): string => {
  const source = resolveChildPath(work, "source");
  const archive = resolveChildPath(work, "source.tar");
  fs.mkdirSync(source, { recursive: true });

  // The received commit may still be in Git's quarantine, so keep its environment here.
  runCommand(settings.git, [
    `--git-dir=${settings.receiver}`,
    "archive",
    "--format=tar",
    `--output=${archive}`,
    revision,
  ]);
  runCommand(settings.tar, ["-xf", archive, "-C", source]);
  listFiles(source); // Reject links and junctions before running any project code.
  exportSubmodules(settings, revision, source, work);
  listFiles(source);
  for (const required of ["package.json", "bun.lock"] as const) {
    if (!fs.existsSync(resolveChildPath(source, required))) {
      throw new Error(`Pushed main is missing ${required}. Commit the Bun app before pushing.`);
    }
  }
  return source;
};

const buildSite = (settings: DeploymentSettings, revision: string, source: string): string => {
  const env = {
    ...createBuildEnvironment(settings.bun),
    BASE_PATH: "/~bergenwb",
  };
  const options = { cwd: source, env };
  console.log(`Building main commit ${revision} for /~bergenwb with Bun ...`);
  runCommand(settings.bun, ["install", "--frozen-lockfile"] as const, options);
  runCommand(settings.bun, ["run", "check"] as const, options);
  runCommand(settings.bun, ["run", "build"] as const, options);

  const build = resolveChildPath(source, "build");
  if (
    !fs.existsSync(resolveChildPath(build, "index.html")) ||
    !fs.existsSync(resolveChildPath(build, "_app"))
  ) {
    throw new Error("Build did not produce index.html and static assets.");
  }
  return build;
};

const cacheRelease = (settings: DeploymentSettings, revision: string, build: string): void => {
  const releaseName = `releases/${revision}`;
  const release = resolveChildPath(settings.cache, releaseName);
  removeDirectory(settings.cache, releaseName);
  fs.mkdirSync(release, { recursive: true });
  copyDirectory(build, release);
};

export const buildRevision = (settings: DeploymentSettings, revision: string): void => {
  withLock(settings.cache, "build.running", () => {
    const workName = `work-${randomUUID()}`;
    const work = resolveChildPath(settings.cache, workName);
    let complete = false;
    try {
      const source = exportRevision(settings, revision, work);
      const build = buildSite(settings, revision, source);
      cacheRelease(settings, revision, build);
      complete = true;
      console.log("Static build verified. The receiver can now accept main.");
    } finally {
      if (complete) {
        removeDirectory(settings.cache, workName);
      } else {
        console.error(`Build diagnostics retained in ${work}`);
      }
    }
  });
};
