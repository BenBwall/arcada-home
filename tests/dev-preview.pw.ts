import { basename, dirname, join, resolve } from "node:path";
import { cpSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { tmpdir } from "node:os";

const collect = async (stream: ReadableStream<Uint8Array>, append: (text: string) => void) => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const result = await reader.read();
    if (result.done) {
      break;
    }
    append(decoder.decode(result.value));
  }
};

test("development reloads external card-game edits and preserves the last successful build", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const fixture = mkdtempSync(join(tmpdir(), "arcada-preview-"));
  const source = join(fixture, "src");
  cpSync(resolve("vendor/cardgame/src"), source, { recursive: true });
  const filename = join(source, "card-game.ts");
  const original = readFileSync(filename, "utf8");
  const port = 4176;
  const base = `http://127.0.0.1:${port}/~bergenwb/`;
  const child = Bun.spawn([process.execPath, "scripts/serve.mts", "--watch"], {
    cwd: resolve("."),
    env: {
      ...process.env,
      BASE_PATH: "/~bergenwb",
      CARDGAME_SOURCE_DIR: source,
      PORT: String(port),
    },
    stderr: "pipe",
    stdout: "pipe",
  });
  let output = "";
  const append = (text: string) => {
    output += text;
  };
  const logs = Promise.all([collect(child.stdout, append), collect(child.stderr, append)]);
  try {
    await expect
      .poll(() => output.includes("Browser reload is automatic."), { timeout: 20_000 })
      .toBe(true);
    await page.goto(base);
    await expect(page.locator("card-game .mode")).toHaveText("Single player · Free play");
    const initialRevision = await page
      .locator("script[data-revision]")
      .getAttribute("data-revision");
    // Atomic editor saves replace the file instead of modifying its inode.
    const temporary = join(source, "card-game.next");
    writeFileSync(temporary, original.replace("Single player · Free play", "Live sibling preview"));
    renameSync(temporary, filename);
    await expect(page.locator("card-game .mode")).toHaveText("Live sibling preview", {
      timeout: 15_000,
    });
    expect(await page.locator("script[data-revision]").getAttribute("data-revision")).not.toBe(
      initialRevision,
    );

    // A newly created source file also triggers rebuilding and is served as a module.
    const changedRevision = await page
      .locator("script[data-revision]")
      .getAttribute("data-revision");
    writeFileSync(
      join(source, "preview-probe.ts"),
      'export const previewProbe = "new source file";\n',
    );
    await expect
      .poll(() => page.locator("script[data-revision]").getAttribute("data-revision"), {
        timeout: 15_000,
      })
      .not.toBe(changedRevision);
    const clientUrl = await page.locator('script[src$="/client.js"]').getAttribute("src");
    if (!clientUrl) {
      throw new Error("The preview has no client module.");
    }
    const probeUrl = new URL("vendor/cardgame/preview-probe.js", new URL(clientUrl, base)).href;
    expect(await (await page.request.get(probeUrl)).text()).toContain("new source file");

    // Bad source must not replace the valid preview or cause an automatic reload.
    const validRevision = await page.locator("script[data-revision]").getAttribute("data-revision");
    writeFileSync(join(source, "broken.ts"), "const broken = ;");
    await expect
      .poll(() => output.includes("keeping the last successful preview"), { timeout: 15_000 })
      .toBe(true);
    await expect(page.locator("card-game .mode")).toHaveText("Live sibling preview");
    expect(await page.locator("script[data-revision]").getAttribute("data-revision")).toBe(
      validRevision,
    );
    const stillServed = await page.request.get(base);
    expect(stillServed.status()).toBe(200);
    rmSync(join(source, "broken.ts"));
    writeFileSync(filename, original);
    await expect(page.locator("card-game .mode")).toHaveText("Single player · Free play", {
      timeout: 15_000,
    });
  } finally {
    child.kill();
    await child.exited;
    await logs;
    // This is a test-owned directory created above, never a checkout.
    if (dirname(fixture) === resolve(tmpdir()) && basename(fixture).startsWith("arcada-preview-")) {
      rmSync(fixture, { force: true, recursive: true });
    }
  }
});
