import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const routes = [
  { heading: "About me", path: "./" },
  { heading: "Ben Bergenwall", path: "resume/" },
  { heading: "Projects", path: "projects/" },
];

test("all pages are static, accessible without JavaScript, and responsive", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const route of routes) {
    await page.goto(`./${route.path}`);
    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    await expect(page.locator('nav a[aria-current="page"]')).toHaveCount(1);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ height: 900, width });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
  await context.close();
});

test("Lit hydrates without replacing the rendered button and navigation works", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      errors.push(response.url());
    }
  });
  await page.route("**/_app/**/client.js", async (route) => {
    await page.waitForFunction(() =>
      document.querySelector("appearance-panel")?.shadowRoot?.querySelector("button"),
    );
    await page.evaluate(() => {
      const button = document
        .querySelector("appearance-panel")
        ?.shadowRoot?.querySelector("button");
      button?.setAttribute("data-before-hydration", "preserved");
    });
    await route.continue();
  });
  await page.goto("./");
  const trigger = page.getByRole("button", { exact: true, name: "Appearance" });
  await expect(trigger).toBeEnabled();
  await expect(trigger).toHaveAttribute("data-before-hydration", "preserved");
  for (const name of ["Resume", "Projects", "Home"]) {
    await page.getByRole("link", { exact: true, name }).click();
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
  expect(errors).toEqual([]);
});

test("appearance follows the device, persists, and synchronizes across tabs", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("./");
  await page.getByRole("button", { exact: true, name: "Appearance" }).click();
  await page.getByRole("combobox", { exact: true, name: "Color scheme" }).selectOption("turtle");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "turtle-light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "turtle-dark");
  const other = await context.newPage();
  await other.goto("resume/");
  await page.getByRole("combobox", { exact: true, name: "Appearance" }).selectOption("light");
  await expect(other.locator("html")).toHaveAttribute("data-theme", "turtle-light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "turtle-light");
  await other.close();
});

test("custom themes support editing, validation, OKLCH, cancel, export, import and deletion", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.getByRole("button", { exact: true, name: "Appearance" }).click();
  await page.getByRole("button", { exact: true, name: "Customize" }).click();
  await page.getByLabel("Theme name", { exact: true }).fill("Test theme");
  await page.getByRole("combobox", { exact: true, name: "Base appearance" }).selectOption("dark");
  await page
    .getByRole("combobox", { exact: true, name: "Base color scheme" })
    .selectOption("lagoon");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "lagoon-dark");
  const background = page.getByRole("textbox", { exact: true, name: "Background CSS color" });
  await background.fill("not-a-color");
  await expect(page.getByRole("button", { exact: true, name: "Save theme" })).toBeDisabled();
  await expect(background).toHaveAttribute("aria-invalid", "true");
  await background.fill("oklch(30% 0.04 220 / 80%)");
  await page.getByRole("button", { exact: true, name: "Pick background color" }).click();
  const hue = page.getByRole("spinbutton", { exact: true, name: "Background hue value" });
  await hue.fill("360");
  await hue.press("Tab");
  await expect(hue).toHaveValue("360");
  const chroma = page.getByRole("spinbutton", { exact: true, name: "Background chroma value" });
  await chroma.fill("0.123456");
  await chroma.press("Tab");
  await expect(chroma).toHaveValue("0.123456");
  await page.getByRole("button", { exact: true, name: "Save theme" }).click();
  await expect(page.locator("appearance-panel").getByRole("status")).toHaveText("Theme saved.");
  await page.getByRole("button", { exact: true, name: "Edit" }).click();
  await background.fill("red");
  await page.getByRole("button", { exact: true, name: "Cancel" }).click();
  expect(
    await page
      .locator("html")
      .evaluate((node) => node.style.getPropertyValue("--color-background")),
  ).toContain("0.123456");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { exact: true, name: "Export themes" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("arcada-themes.json");
  const file = await download.path();
  if (!file) {
    throw new Error("Export did not produce a file.");
  }
  await page.locator("appearance-panel").locator('input[type="file"]').setInputFiles(file);
  await expect(page.locator("appearance-panel").getByRole("status")).toHaveText(
    "Themes imported. Choose one to try it.",
  );
  await page.getByRole("button", { exact: true, name: "Delete" }).click();
  await expect(page.locator("appearance-panel").getByRole("status")).toHaveText("Theme deleted.");
  await page
    .locator("appearance-panel")
    .locator('input[type="file"]')
    .setInputFiles({
      buffer: Buffer.from("{}"),
      mimeType: "application/json",
      name: "invalid.json",
    });
  await expect(page.getByRole("alert")).toBeVisible();
  expect(errors).toEqual([]);
});

test("application output has readable modules, styles and static page content", () => {
  const version: unknown = JSON.parse(readFileSync("build/_app/version.json", "utf8"));
  if (
    typeof version !== "object" ||
    version === null ||
    !("release" in version) ||
    typeof version.release !== "string"
  ) {
    throw new Error("Invalid build version.");
  }
  const { release } = version;
  const directory = join("build/_app", release);
  const component = readFileSync(join(directory, "lib/components/appearance-panel.js"), "utf8");
  expect(component).toContain("class AppearancePanel extends LitElement");
  expect(component).toContain("renderSelectors()");
  expect(component).toContain("import");
  expect(component).not.toContain("svelte");
  for (const name of readdirSync(join(directory, "styles"))) {
    expect(
      readFileSync(join(directory, "styles", name), "utf8").split("\n").length,
    ).toBeGreaterThan(5);
  }
  const home = readFileSync("build/index.html", "utf8");
  expect(home).toContain('shadowrootmode="open"');
  expect(home).toContain("About me");
  expect(home).not.toContain("<!--[-->");
  expect(home).not.toContain("svelte-");
});

test("saved colors apply on every page even when all application modules are blocked", async ({
  browser,
}) => {
  const cases = [
    { saved: { mode: "dark", scheme: "classic", themes: [], version: 2 }, theme: "dark" },
    { saved: { mode: "light", scheme: "classic", themes: [], version: 2 }, theme: "light" },
    { saved: { mode: "system", scheme: "classic", themes: [], version: 2 }, theme: "dark" },
    { saved: { active: "dark", themes: [], version: 1 }, theme: "dark" },
    {
      saved: {
        mode: "dark",
        scheme: "custom-test",
        themes: [
          {
            base: "dark",
            baseScheme: "lagoon",
            colors: { background: "#123456" },
            id: "custom-test",
            name: "Custom",
          },
        ],
        version: 2,
      },
      theme: "lagoon-dark",
    },
  ];
  for (const scenario of cases) {
    const context = await browser.newContext({ colorScheme: "dark" });
    await context.addInitScript((saved) => {
      localStorage.setItem("appearance-v1", JSON.stringify(saved));
    }, scenario.saved);
    await context.route("**/_app/**/*.js", (route) => route.abort());
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(`./${route.path}`);
      await expect(page.locator("html")).toHaveAttribute("data-theme", scenario.theme);
      if (scenario.theme === "dark") {
        await expect(page.locator("body")).toHaveCSS("background-color", "oklch(0.2 0 0)");
      } else if (scenario.theme === "lagoon-dark") {
        await expect(page.locator("body")).toHaveCSS("background-color", "rgb(18, 52, 86)");
      }
    }
    await context.close();
  }
});
