import { basename, join } from "node:path";
import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { deploymentEnvironment } from "$scripts/build";
import { removeDirectory } from "$scripts/shared";
import { tmpdir } from "node:os";

test("deployment reads persistent values outside html and reloads them for each build", () => {
  const work = mkdtempSync(join(tmpdir(), "deployment-env-"));
  try {
    const settings = { bun: process.execPath, target: join(work, "html") };
    const filename = join(work, ".env.local");
    const inherited = { GIT_DIR: "old", MULTIPLAYER_PROD_URL: "https://old.example.org" };
    expect(deploymentEnvironment(settings, inherited).MULTIPLAYER_PROD_URL).toBe(
      inherited.MULTIPLAYER_PROD_URL,
    );
    writeFileSync(
      filename,
      '# Deployment settings\nMULTIPLAYER_PROD_URL="https://game.example.org"\nLABEL="a # b"\nGIT_DIR=wrong\nBASE_PATH=/wrong\n',
    );
    const env = deploymentEnvironment(settings, inherited);
    expect(env.MULTIPLAYER_PROD_URL).toBe("https://game.example.org");
    expect(env.LABEL).toBe("a # b");
    expect(env.GIT_DIR).toBeUndefined();
    expect(env.BASE_PATH).toBe("/~bergenwb");
    expect(inherited.MULTIPLAYER_PROD_URL).toBe("https://old.example.org");
    writeFileSync(filename, "MULTIPLAYER_URL=\n");
    expect(
      deploymentEnvironment(settings, { MULTIPLAYER_URL: "https://old.example.org" })
        .MULTIPLAYER_URL,
    ).toBe("");
  } finally {
    removeDirectory(tmpdir(), basename(work));
  }
});

test("an unreadable deployment env path fails instead of silently using stale values", () => {
  const work = mkdtempSync(join(tmpdir(), "deployment-env-"));
  try {
    mkdirSync(join(work, ".env.local"));
    expect(() =>
      deploymentEnvironment({ bun: process.execPath, target: join(work, "html") }),
    ).toThrow();
  } finally {
    removeDirectory(tmpdir(), basename(work));
  }
});
