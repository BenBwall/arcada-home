import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { pushedMain, updateGamePin } from "$scripts/cardgame-deploy";
import { removeDirectory, runCommand } from "$scripts/shared";
import { basename } from "node:path";
import { tmpdir } from "node:os";

const COMMIT_ID_LENGTH = 40;
const oldGame = "1".repeat(COMMIT_ID_LENGTH);
const newGame = "2".repeat(COMMIT_ID_LENGTH);
const zero = "0".repeat(COMMIT_ID_LENGTH);

describe("cardgame main push selection", () => {
  test("ignores branches and tags, and handles main creation and update", () => {
    expect(pushedMain("")).toBeUndefined();
    expect(pushedMain(`${zero} ${newGame} refs/heads/feature\n`)).toBeUndefined();
    expect(pushedMain(`${zero} ${newGame} refs/tags/main\n`)).toBeUndefined();
    expect(pushedMain(`${zero} ${newGame} refs/heads/main\n`)).toBe(newGame);
    expect(
      pushedMain(`${oldGame} ${newGame} refs/heads/main\n${zero} ${newGame} refs/heads/feature\n`),
    ).toBe(newGame);
  });

  test("rejects main deletion, malformed commit IDs, and duplicate main updates", () => {
    expect(() => pushedMain(`${oldGame} ${zero} refs/heads/main`)).toThrow();
    expect(() => pushedMain(`${oldGame} invalid refs/heads/main`)).toThrow();
    expect(() => pushedMain("missing fields")).toThrow();
    expect(() =>
      pushedMain(`${oldGame} ${newGame} refs/heads/main\n${oldGame} ${newGame} refs/heads/main`),
    ).toThrow();
  });
});

test("pinning changes only the gitlink, retains parent history, and skips duplicate commits", () => {
  const work = mkdtempSync(`${tmpdir()}/cardgame-pin-test-`);
  const git = (args: string[]): string => runCommand("git", args, { capture: true, cwd: work });
  try {
    git(["init", "--initial-branch=main"]);
    writeFileSync(`${work}/README.md`, "Original homepage content\n");
    git(["add", "README.md"]);
    git(["update-index", "--add", "--cacheinfo", `160000,${oldGame},vendor/cardgame`]);
    git(["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "Initial"]);
    const parent = git(["rev-parse", "HEAD"]);
    expect(updateGamePin("git", work, oldGame)).toBe(parent);
    expect(() => updateGamePin("git", work, "invalid")).toThrow("Invalid game commit ID");
    const commit = updateGamePin("git", work, newGame);
    expect(git(["rev-parse", `${commit}^`])).toBe(parent);
    expect(git(["rev-parse", "HEAD"])).toBe(parent);
    expect(git(["diff-tree", "--no-commit-id", "--name-only", "-r", commit])).toBe(
      "vendor/cardgame",
    );
    expect(git(["show", `${commit}:README.md`])).toBe("Original homepage content");
    expect(git(["ls-tree", commit, "vendor/cardgame"])).toContain(`160000 commit ${newGame}`);
    git(["update-ref", "refs/heads/main", commit, parent]);
    expect(updateGamePin("git", work, newGame)).toBe(commit);
  } finally {
    removeDirectory(tmpdir(), basename(work));
  }
});

test("refuses to create a missing submodule in an unrelated parent repository", () => {
  const work = mkdtempSync(`${tmpdir()}/cardgame-missing-test-`);
  const git = (args: string[]): string => runCommand("git", args, { capture: true, cwd: work });
  try {
    git(["init", "--initial-branch=main"]);
    git([
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "commit",
      "--allow-empty",
      "-m",
      "Initial",
    ]);
    expect(() => updateGamePin("git", work, newGame)).toThrow(
      "does not contain the cardgame submodule",
    );
  } finally {
    removeDirectory(tmpdir(), basename(work));
  }
});
