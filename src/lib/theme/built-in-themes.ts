export const DEFAULT_SCHEME = "dusk";

export const colorSchemes = [
  { dark: "dusk-dark", id: "dusk", light: "dusk-light", name: "Purple" },
  { dark: "turtle-dark", id: "turtle", light: "turtle-light", name: "Green" },
  { dark: "peach-dark", id: "peach", light: "peach-light", name: "Orange" },
  { dark: "lagoon-dark", id: "lagoon", light: "lagoon-light", name: "Blue" },
  { dark: "dark", id: "classic", light: "light", name: "Neutral" },
] as const;

export type ColorSchemeId = (typeof colorSchemes)[number]["id"];

export const getColorScheme = (value: unknown) =>
  colorSchemes.find((scheme) => scheme.id === value);

export const builtInThemes = [
  { base: "light", id: "turtle-light", legacyId: "turtle", name: "Green" },
  { base: "dark", id: "turtle-dark", name: "Green" },
  { base: "light", id: "peach-light", legacyId: "peach", name: "Orange" },
  { base: "dark", id: "peach-dark", name: "Orange" },
  { base: "light", id: "lagoon-light", name: "Blue" },
  { base: "dark", id: "lagoon-dark", legacyId: "lagoon", name: "Blue" },
  { base: "light", id: "dusk-light", name: "Purple" },
  { base: "dark", id: "dusk-dark", legacyId: "dusk", name: "Purple" },
  { base: "light", id: "light", name: "Neutral" },
  { base: "dark", id: "dark", name: "Neutral" },
] as const;

export type BuiltInThemeId = (typeof builtInThemes)[number]["id"];

// Keep earlier saved choices on their original light or dark palette.
export const getBuiltInTheme = (value: unknown) =>
  builtInThemes.find(
    (theme) => theme.id === value || ("legacyId" in theme && theme.legacyId === value),
  );
