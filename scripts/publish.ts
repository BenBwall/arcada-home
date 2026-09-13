import * as fs from "node:fs";
import * as path from "node:path";
import {
  type DeploymentSettings,
  assertNoSymlinks,
  copyFile,
  hashFile,
  listFiles,
  readMainRevision,
  resolveChildPath,
  withLock,
  writeJson,
} from "$scripts/shared";
import { randomUUID } from "node:crypto";

const PUBLIC_URL = "https://people.arcada.fi/~bergenwb/";

type ChangedFile = {
  destination: string;
  backup: string;
  existed: boolean;
};

const assetsBeforeHtml = (first: string, second: string): number => {
  const htmlOrder = Number(first.endsWith(".html")) - Number(second.endsWith(".html"));
  return htmlOrder || first.localeCompare(second);
};

const publishFile = (
  source: string,
  destination: string,
  backup: string,
  changes: ChangedFile[],
): void => {
  assertNoSymlinks(destination);
  const existed = fs.existsSync(destination);
  if (existed && hashFile(source) === hashFile(destination)) {
    return;
  }
  if (existed) {
    copyFile(destination, backup);
  }

  const temporary = resolveChildPath(
    path.dirname(destination),
    `${path.basename(destination)}.deploy-${randomUUID()}`,
  );
  try {
    copyFile(source, temporary);
    if (hashFile(source) !== hashFile(temporary)) {
      throw new Error(`Copy verification failed: ${source}`);
    }
    // Record the backup before replacement so a failed rename can also be rolled back.
    changes.push({ backup, destination, existed });
    fs.renameSync(temporary, destination);
  } finally {
    if (fs.existsSync(temporary)) {
      fs.unlinkSync(temporary);
    }
  }
};

const rollbackFiles = (changes: ChangedFile[], backup: string): void => {
  const failures: unknown[] = [];
  for (const change of changes.toReversed()) {
    try {
      if (change.existed) {
        copyFile(change.backup, change.destination);
      } else if (fs.existsSync(change.destination)) {
        fs.unlinkSync(change.destination);
      }
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length) {
    console.error(`Rollback could not restore ${failures.length} files. Backups: ${backup}`);
  }
};

const recordDeployment = (settings: DeploymentSettings, revision: string): void => {
  writeJson(resolveChildPath(settings.receiver, "last-deployment.json"), {
    deployedAt: new Date().toISOString(),
    revision,
    target: settings.target,
    url: PUBLIC_URL,
  });
  console.log(`Deployed ${revision} to ${settings.target}\n${PUBLIC_URL}`);
};

export const publishRevision = (settings: DeploymentSettings, revision: string): void => {
  const release = resolveChildPath(settings.cache, `releases/${revision}`);
  if (!fs.existsSync(resolveChildPath(release, "index.html"))) {
    throw new Error("Verified build is missing; run bun run deploy to rebuild it.");
  }
  assertNoSymlinks(settings.target);
  fs.mkdirSync(settings.target, { recursive: true });

  withLock(settings.receiver, "publish.running", () => {
    const changes: ChangedFile[] = [];
    const backup = resolveChildPath(settings.cache, `backups/${Date.now()}-${randomUUID()}`);
    try {
      if (readMainRevision(settings) !== revision) {
        console.log("A newer main commit has arrived; skipping this older deployment.");
        return;
      }
      // Assets first, HTML last. Preserve old assets and unrelated public files.
      for (const file of listFiles(release).toSorted(assetsBeforeHtml)) {
        const relative = path.relative(release, file);
        publishFile(
          file,
          resolveChildPath(settings.target, relative),
          resolveChildPath(backup, relative),
          changes,
        );
      }
      recordDeployment(settings, revision);
    } catch (error) {
      rollbackFiles(changes, backup);
      throw error;
    }
  });
};
