import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const REQUEST_TIMEOUT_MS = 45_000;
const REQUEST_INTERVAL_MS = 1_100;

type JsonObject = Record<string, unknown>;
export type Diagnostic = { column: number; line: number; message: string; severity: string };
export type ValidationResult = { diagnostics: Diagnostic[]; errors: number };

const object = (value: unknown): JsonObject => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Expected a validator JSON object.");
  }
  return Object.fromEntries(Object.entries(value));
};

const messages = (value: unknown): JsonObject[] => {
  if (!Array.isArray(value)) {
    throw new Error("Expected a validator messages array.");
  }
  return value.map(object);
};

const diagnostic = (entry: JsonObject, severity: string): Diagnostic => {
  if (typeof entry.message !== "string") {
    throw new Error("Validator diagnostic is missing its message.");
  }
  return {
    column: Number(entry.firstColumn ?? entry.lastColumn ?? 1),
    line: Number(entry.firstLine ?? entry.lastLine ?? entry.line ?? 1),
    message: entry.message.replace(/\s+/g, " ").trim(),
    severity,
  };
};

export const parseHtmlResult = (value: unknown): ValidationResult => {
  const diagnostics = messages(object(value).messages).map((entry) => {
    if (!["info", "error", "non-document-error"].includes(String(entry.type))) {
      throw new Error("Unknown HTML validator message type.");
    }
    const severity = entry.type === "info" ? "info" : "error";
    return diagnostic(entry, entry.subType === "warning" ? "warning" : severity);
  });
  return {
    diagnostics,
    errors: diagnostics.filter((entry) => entry.severity === "error").length,
  };
};

export const parseCssResult = (value: unknown): ValidationResult => {
  const validation = object(object(value).cssvalidation);
  const result = object(validation.result);
  if (
    typeof validation.validity !== "boolean" ||
    typeof result.errorcount !== "number" ||
    !Number.isInteger(result.errorcount) ||
    result.errorcount < 0
  ) {
    throw new Error("CSS validator response is missing a valid result.");
  }
  const errors = messages(validation.errors ?? []);
  if (errors.length !== result.errorcount || validation.validity !== (result.errorcount === 0)) {
    throw new Error("CSS validator returned an inconsistent result.");
  }
  return {
    diagnostics: [
      ...errors.map((entry) => diagnostic(entry, "error")),
      ...messages(validation.warnings ?? []).map((entry) => diagnostic(entry, "warning")),
    ],
    errors: result.errorcount,
  };
};

export const findDocuments = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const filename = join(directory, entry.name);
      if (entry.isDirectory()) {
        return findDocuments(filename);
      }
      return entry.isFile() && /\.(?:html|css)$/i.test(entry.name) ? [filename] : [];
    })
    .toSorted();

export const validateDocument = async (filename: string): Promise<ValidationResult> => {
  const html = filename.toLowerCase().endsWith(".html");
  const source = readFileSync(filename, "utf8");
  const url = new URL(
    html
      ? (process.env.W3C_HTML_VALIDATOR_URL ?? "https://validator.w3.org/nu/")
      : (process.env.W3C_CSS_VALIDATOR_URL ?? "https://jigsaw.w3.org/css-validator/validator"),
  );
  const form = new FormData();
  if (html) {
    url.searchParams.set("out", "json");
  } else {
    for (const [key, value] of Object.entries({
      lang: "en",
      output: "json",
      profile: "css3svg",
      text: source,
      warning: "2",
    })) {
      form.set(key, value);
    }
  }
  const response = await fetch(url, {
    body: html ? source : form,
    headers: html ? { "Content-Type": "text/html; charset=utf-8" } : {},
    method: "POST",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`${url.origin}: HTTP ${response.status} ${response.statusText}`);
  }
  const result: unknown = await response.json();
  return html ? parseHtmlResult(result) : parseCssResult(result);
};

export const validateBuild = async (directory: string, kind?: string): Promise<number> => {
  if (kind !== undefined && kind !== "html" && kind !== "css") {
    throw new Error("Usage: bun scripts/validate-w3c.ts [html|css]");
  }
  const files = findDocuments(directory).filter(
    (file) => !kind || file.toLowerCase().endsWith(`.${kind}`),
  );
  for (const extension of kind ? [kind] : ["html", "css"]) {
    if (!files.some((file) => file.toLowerCase().endsWith(`.${extension}`))) {
      throw new Error(`No .${extension} files in ${directory}. Run bun run build first.`);
    }
  }
  let errors = 0;
  let unavailable = 0;
  console.log(`Validating ${files.length} built files with W3C services ...`);
  // W3C requests at least one second between requests to its public CSS service.
  for (const [index, filename] of files.entries()) {
    try {
      if (index > 0) {
        // oxlint-disable-next-line eslint/no-await-in-loop -- Pace requests to the public validation services.
        await sleep(REQUEST_INTERVAL_MS);
      }
      // oxlint-disable-next-line eslint/no-await-in-loop -- Validate sequentially to respect W3C service limits.
      const result = await validateDocument(filename);
      errors += result.errors;
      for (const entry of result.diagnostics) {
        console.log(
          `${filename}:${entry.line}:${entry.column}: ${entry.severity}: ${entry.message}`,
        );
      }
      console.log(`${filename}: ${result.errors === 0 ? "valid" : `${result.errors} error(s)`}`);
    } catch (error) {
      unavailable += 1;
      console.error(
        `${filename}: validation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  console.log(`W3C: ${files.length} files, ${errors} error(s), ${unavailable} failed request(s).`);
  return errors > 0 || unavailable > 0 ? 1 : 0;
};
