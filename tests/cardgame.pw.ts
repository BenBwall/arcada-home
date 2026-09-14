import { expect, test } from "@playwright/test";

test("homepage card game supports keyboard play, undo, sorting, and reset offline", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  const connections: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("websocket", (socket) => connections.push(socket.url()));
  await page.goto("./");
  const game = page.locator("card-game");
  await expect(game.getByRole("button", { name: "Draw a card" })).toBeVisible();
  await expect(game.getByRole("heading", { name: "Your hand (0)" })).toBeVisible();
  await expect(game.getByRole("button", { exact: true, name: "Undo" })).toBeDisabled();
  // Once static assets load, no connection is needed for any game action.
  await context.setOffline(true);
  await game.getByRole("button", { name: "Draw a card" }).focus();
  await page.keyboard.press("Enter");
  await expect(game.getByRole("heading", { name: "Your hand (1)" })).toBeVisible();
  const firstCard = await game.getByRole("button", { name: /^Play / }).getAttribute("aria-label");
  if (!firstCard) {
    throw new Error("Drawn card is missing its accessible label.");
  }
  for (let index = 0; index < 4; index++) {
    await game.getByRole("button", { name: "Draw a card" }).click();
  }
  const drawnOrder = await game
    .locator(".hand button")
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label")));
  await game.getByLabel("Sort", { exact: true }).selectOption("suit-then-rank");
  await game.getByLabel("Sort", { exact: true }).selectOption("draw-order");
  expect(
    await game
      .locator(".hand button")
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label"))),
  ).toEqual(drawnOrder);
  const card = game.getByRole("button", { exact: true, name: firstCard });
  await card.focus();
  await page.keyboard.press("Enter");
  await expect(game.getByRole("heading", { name: "Your hand (4)" })).toBeVisible();
  await expect(
    game.getByRole("img", { name: firstCard.replace("Play ", "Last played: ") }),
  ).toBeVisible();
  await expect(game.locator(".hand button").first()).toBeFocused();
  await game.getByRole("button", { exact: true, name: "Undo" }).click();
  await expect(game.getByRole("heading", { name: "Your hand (5)" })).toBeVisible();
  await expect(card).toBeVisible();
  await game.getByRole("button", { exact: true, name: "New deck" }).click();
  await game.getByRole("button", { exact: true, name: "Keep playing" }).click();
  await expect(game.getByRole("heading", { name: "Your hand (5)" })).toBeVisible();
  await game.getByRole("button", { exact: true, name: "New deck" }).click();
  await game.getByRole("button", { exact: true, name: "Shuffle new deck" }).click();
  await expect(game.getByRole("heading", { name: "Your hand (0)" })).toBeVisible();
  await expect(game.getByRole("button", { exact: true, name: "Undo" })).toBeDisabled();
  await expect(game.getByRole("button", { name: "Draw a card" })).toBeFocused();
  expect(errors).toEqual([]);
  expect(connections).toEqual([]);
});

test("a complete local game remains usable at narrow widths and both themes", async ({ page }) => {
  await page.goto("./");
  const game = page.locator("card-game");
  const draw = game.getByRole("button", { name: "Draw a card" });
  for (let index = 0; index < 52; index++) {
    await draw.click();
  }
  await expect(draw).toBeDisabled();
  await expect(game.locator(".hand button")).toHaveCount(52);
  for (const mode of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: mode });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ height: 900, width });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
  for (let index = 0; index < 52; index++) {
    await game.locator(".hand button").first().click();
  }
  await expect(game.getByRole("status")).toHaveText(
    "All 52 cards played. Start a new deck to play again.",
  );
  await expect(game.getByRole("button", { exact: true, name: "New deck" })).toBeFocused();
  await game.getByRole("button", { exact: true, name: "Undo" }).click();
  await expect(game.locator(".hand button")).toHaveCount(1);
  await expect(draw).toBeDisabled();
});

test("game instances and tabs are isolated, reload resets, and other pages have no game", async ({
  page,
  context,
}) => {
  await page.goto("./");
  const game = page.locator("card-game").first();
  await game.getByRole("button", { name: "Draw a card" }).click();
  await page.evaluate(() =>
    document.getElementById("card-game-mount")?.append(document.createElement("card-game")),
  );
  await expect(
    page.locator("card-game").nth(1).getByRole("heading", { name: "Your hand (0)" }),
  ).toBeVisible();
  const secondPage = await context.newPage();
  await secondPage.goto("./");
  await expect(
    secondPage.locator("card-game").getByRole("heading", { name: "Your hand (0)" }),
  ).toBeVisible();
  await expect(game.getByRole("heading", { name: "Your hand (1)" })).toBeVisible();
  await page.reload();
  await expect(game.getByRole("heading", { name: "Your hand (0)" })).toBeVisible();
  await page.getByRole("link", { exact: true, name: "Resume" }).click();
  await expect(page.locator("card-game")).toHaveCount(0);
  await secondPage.close();
});
