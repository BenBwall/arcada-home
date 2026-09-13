import { afterAll, expect, test } from "bun:test";
import {
  findDocuments,
  parseCssResult,
  parseHtmlResult,
  validateBuild,
  validateDocument,
} from "$scripts/w3c";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { rejects } from "node:assert/strict";
import { tmpdir } from "node:os";

const directory = mkdtempSync(join(tmpdir(), "arcada-w3c-test-"));
const htmlFile = join(directory, "index.html");
const cssFile = join(directory, "assets", "site.css");
const htmlSource = '<!doctype html><html lang="en"><title>Test</title><p>Test</p></html>';
const cssSource = "p { color: definitely-not-a-color; }";
mkdirSync(join(directory, "assets"));
writeFileSync(htmlFile, htmlSource);
writeFileSync(cssFile, cssSource);
writeFileSync(join(directory, "assets", "site.js"), "// Ignored");
const cssFailure = {
  cssvalidation: {
    errors: [{ line: 1, message: "Invalid color" }],
    result: { errorcount: 1, warningcount: 0 },
    validity: false,
  },
};
const SERVICE_UNAVAILABLE = 503;
const requests: { body: string; path: string; profile: string | null }[] = [];
const server = Bun.serve({
  fetch: async (request) => {
    const url = new URL(request.url);
    if (url.pathname === "/unavailable") {
      return new Response("Unavailable", { status: SERVICE_UNAVAILABLE });
    }
    if (url.pathname === "/html") {
      expect(request.method).toBe("POST");
      expect(request.headers.get("content-type")).toBe("text/html; charset=utf-8");
      expect(url.searchParams.get("out")).toBe("json");
      requests.push({ body: await request.text(), path: url.pathname, profile: null });
      return Response.json({ messages: [] });
    }
    // oxlint-disable-next-line typescript/no-deprecated -- A bounded local test fixture, not a production multipart server.
    const form = await request.formData();
    expect(request.method).toBe("POST");
    expect(form.get("output")).toBe("json");
    const body = form.get("text");
    const profile = form.get("profile");
    if (typeof body !== "string" || typeof profile !== "string") {
      throw new Error("Expected CSS text and profile fields.");
    }
    requests.push({ body, path: url.pathname, profile });
    return Response.json(cssFailure);
  },
  hostname: "127.0.0.1",
  port: 0,
});
const originalHtmlUrl = process.env.W3C_HTML_VALIDATOR_URL;
const originalCssUrl = process.env.W3C_CSS_VALIDATOR_URL;
process.env.W3C_HTML_VALIDATOR_URL = new URL("html", server.url).href;
process.env.W3C_CSS_VALIDATOR_URL = new URL("css", server.url).href;

afterAll(async () => {
  await server.stop(true);
  rmSync(directory, { recursive: true });
  for (const [key, value] of Object.entries({
    W3C_CSS_VALIDATOR_URL: originalCssUrl,
    W3C_HTML_VALIDATOR_URL: originalHtmlUrl,
  })) {
    if (value === undefined) {
      Reflect.deleteProperty(process.env, key);
    } else {
      process.env[key] = value;
    }
  }
});

test("HTML errors and indeterminate validation fail; info and warnings retain locations", () => {
  const result = parseHtmlResult({
    messages: [
      { firstColumn: 5, firstLine: 4, message: "Trailing slash", type: "info" },
      { message: "Warning", subType: "warning", type: "info" },
      { message: "Nested header", type: "error" },
      { message: "Checker failed", type: "non-document-error" },
    ],
  });
  expect(result.errors).toBe(2);
  expect(result.diagnostics[0]).toEqual({
    column: 5,
    line: 4,
    message: "Trailing slash",
    severity: "info",
  });
  expect(result.diagnostics[1]?.severity).toBe("warning");
});

test("invalid, empty, and inconsistent responses cannot silently pass", () => {
  expect(() => parseHtmlResult({})).toThrow();
  expect(() => parseHtmlResult({ messages: [{ type: "unknown" }] })).toThrow();
  expect(() => parseCssResult({})).toThrow();
  expect(() =>
    parseCssResult({ cssvalidation: { result: { errorcount: 0 }, validity: false } }),
  ).toThrow();
  expect(parseCssResult(cssFailure).errors).toBe(1);
  expect(
    parseCssResult({
      cssvalidation: {
        result: { errorcount: 0 },
        validity: true,
        warnings: [{ line: 2, message: "Warning" }],
      },
    }).errors,
  ).toBe(0);
});

test("built routes and CSS are discovered recursively and posted unchanged", async () => {
  expect(findDocuments(directory)).toEqual([cssFile, htmlFile].toSorted());
  expect((await validateDocument(htmlFile)).errors).toBe(0);
  expect((await validateDocument(cssFile)).errors).toBe(1);
  expect(requests).toContainEqual({ body: htmlSource, path: "/html", profile: null });
  expect(requests).toContainEqual({ body: cssSource, path: "/css", profile: "css3svg" });
  expect(await validateBuild(directory)).toBe(1);
  expect(await validateBuild(directory, "html")).toBe(0);
});

test("service failures and missing build output fail validation", async () => {
  process.env.W3C_HTML_VALIDATOR_URL = new URL("unavailable", server.url).href;
  try {
    await rejects(validateDocument(htmlFile), /HTTP 503/);
    expect(await validateBuild(directory, "html")).toBe(1);
  } finally {
    process.env.W3C_HTML_VALIDATOR_URL = new URL("html", server.url).href;
  }
  const empty = join(directory, "empty");
  mkdirSync(empty);
  await rejects(validateBuild(empty), /No \.html files/);
  await rejects(validateBuild(directory, "js"), /Usage:/);
});
