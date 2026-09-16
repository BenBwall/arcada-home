import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

export type DeploymentSettings = {
  receiver: string;
  target: string;
  cache: string;
  git: string;
  bun: string;
  tar: string;
};

export const resolveChildPath = (root: string, relative: string): string => {
  const base = path.resolve(root);
  const destination = path.resolve(base, relative);
  const isInsideRoot = destination.toLowerCase().startsWith(base.toLowerCase() + path.sep);
  if (!isInsideRoot) {
    throw new Error(`Path outside deployment directory: ${relative}`);
  }
  return destination;
};

const hasErrorCode = (error: unknown, code: string): boolean =>
  error instanceof Error && "code" in error && error.code === code;

/** Reject symlinks and junctions in the path, including any parent directories. */
export const assertNoSymlinks = (location: string): void => {
  let current = path.resolve(location);
  while (true) {
    try {
      if (fs.lstatSync(current).isSymbolicLink()) {
        throw new Error(`Deployment path contains a link or junction: ${current}`);
      }
    } catch (error) {
      if (!hasErrorCode(error, "ENOENT")) {
        throw error;
      }
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return;
    }
    current = parent;
  }
};

export const listFiles = (root: string): string[] => {
  assertNoSymlinks(root);
  const result: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const filename = resolveChildPath(root, entry.name);
    assertNoSymlinks(filename);
    if (entry.isDirectory()) {
      result.push(...listFiles(filename));
    } else if (entry.isFile()) {
      result.push(filename);
    } else {
      throw new Error(`Unsupported deployment file: ${filename}`);
    }
  }
  return result;
};

export const removeDirectory = (root: string, relative: string): void => {
  const target = resolveChildPath(root, relative);
  assertNoSymlinks(target);
  fs.rmSync(target, { force: true, recursive: true });
};

export const copyFile = (source: string, target: string): void => {
  assertNoSymlinks(source);
  assertNoSymlinks(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
};

export const copyDirectory = (source: string, target: string): void => {
  for (const file of listFiles(source)) {
    copyFile(file, resolveChildPath(target, path.relative(source, file)));
  }
};

export const hashFile = (file: string): string =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");

/** Build processes should use our Bun executable, without inheriting Git hook state. */
export const createBuildEnvironment = (
  bun: string,
  inherited: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv => {
  const environment = Object.fromEntries(
    Object.entries(inherited).filter(([key]) => !/^GIT_/i.test(key)),
  );
  const pathKey = Object.keys(environment).find((key) => key.toUpperCase() === "PATH") ?? "PATH";
  environment[pathKey] = path.dirname(bun) + path.delimiter + (environment[pathKey] ?? "");
  return environment;
};

type CommandOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  capture?: boolean;
};

export const runCommand = (
  executable: string,
  args: string[],
  options: CommandOptions = {},
): string => {
  const result = spawnSync(executable, args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: options.env,
    stdio: options.capture
      ? (["ignore", "pipe", "pipe"] as const)
      : (["ignore", "inherit", "inherit"] as const),
    windowsHide: true,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const details = options.capture ? result.stderr : "";
    throw new Error(
      `${path.basename(executable)} ${args[0]} exited with code ${result.status}: ${details}`,
    );
  }
  return options.capture ? result.stdout.trim() : "";
};

export const withLock = <T>(root: string, name: string, action: () => T): T => {
  assertNoSymlinks(root);
  fs.mkdirSync(root, { recursive: true });
  const lock = resolveChildPath(root, name);
  assertNoSymlinks(lock);
  try {
    // Atomic directory creation works on both NTFS and the mapped SMB share.
    fs.mkdirSync(lock);
  } catch (error) {
    if (hasErrorCode(error, "EEXIST")) {
      throw new Error(
        `Deployment is locked: ${lock}. If a previous process was interrupted, confirm it has stopped before removing this directory.`,
        { cause: error },
      );
    }
    throw error;
  }
  try {
    return action();
  } finally {
    fs.rmdirSync(lock);
  }
};

export const writeJson = (file: string, value: unknown): void => {
  assertNoSymlinks(file);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};

export const readJsonObject = (file: string): Record<string, unknown> => {
  const contents = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const value: unknown = JSON.parse(contents);
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Expected a JSON object in ${file}`);
  }
  return Object.fromEntries(Object.entries(value));
};

export const loadSettings = (file: string): DeploymentSettings => {
  const settings = readJsonObject(file);
  const readPath = (key: keyof DeploymentSettings): string => {
    const value = settings[key];
    if (typeof value !== "string" || !path.isAbsolute(value)) {
      throw new Error(`Invalid deployment setting ${key}; run bun run deploy:setup.`);
    }
    return value;
  };
  return {
    bun: readPath("bun"),
    cache: readPath("cache"),
    git: readPath("git"),
    receiver: readPath("receiver"),
    tar: readPath("tar"),
    target: readPath("target"),
  };
};

export const readMainRevision = (settings: DeploymentSettings): string =>
  runCommand(
    settings.git,
    [`--git-dir=${settings.receiver}`, "rev-parse", "--verify", "refs/heads/main"],
    { capture: true },
  );
