import * as fs from "node:fs";
import { loadSettings, readMainRevision } from "./shared";
import { buildRevision } from "./build";
import { parseArgs } from "node:util";
import { publishRevision } from "./publish";

const forEachReceivedRevision = (handleRevision: (revision: string) => void): void => {
  for (const line of fs.readFileSync(0, "utf8").split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }
    // Git sends one line per updated ref: old revision, new revision, ref name.
    const [, revision, ref] = line.trim().split(/\s+/);
    if (ref !== "refs/heads/main") {
      continue;
    }
    if (/^0+$/.test(revision)) {
      throw new Error("Deleting the deployment main branch is disabled.");
    }
    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(revision)) {
      throw new Error("Invalid commit ID received.");
    }
    handleRevision(revision);
  }
};

export const deploy = (mode: string, config: string): void => {
  if (!["retry", "pre-receive", "post-receive"].includes(mode)) {
    throw new Error(`Invalid deployment mode: ${mode}`);
  }
  const settings = loadSettings(config);
  try {
    if (mode === "retry") {
      const revision = readMainRevision(settings);
      buildRevision(settings, revision);
      publishRevision(settings, revision);
      return;
    }
    const handleRevision = mode === "pre-receive" ? buildRevision : publishRevision;
    forEachReceivedRevision((revision) => {
      handleRevision(settings, revision);
    });
  } catch (error) {
    if (mode === "post-receive") {
      console.error(
        "Git accepted the commit, but publishing failed. Restore drive access and run bun run deploy.",
      );
    }
    throw error;
  }
};

export const main = (): void => {
  const { values } = parseArgs({
    options: { config: { type: "string" }, mode: { default: "retry", type: "string" } },
  });
  if (!values.config) {
    throw new Error("--config is required.");
  }
  deploy(values.mode, values.config);
};
