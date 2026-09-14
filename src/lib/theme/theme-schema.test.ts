/// <reference types="bun" />
import {
  type Appearance,
  type CustomTheme,
  parseAppearance,
  parseCustomTheme,
  parseThemeFile,
} from "$theme/theme-schema.js";
import { builtInThemes, colorSchemes } from "$theme/built-in-themes.js";
import { describe, expect, test } from "bun:test";

describe("appearance settings", () => {
  test("migrates every combined built-in selection", () => {
    for (const theme of builtInThemes) {
      const scheme = colorSchemes.find((item) => item[theme.base] === theme.id);
      const expected: Appearance = {
        mode: theme.base,
        scheme: scheme?.id ?? "",
        themes: [],
        version: 2,
      };
      expect(parseAppearance({ active: theme.id, themes: [], version: 1 })).toEqual(expected);
      if ("legacyId" in theme) {
        expect(parseAppearance({ active: theme.legacyId, themes: [], version: 1 })).toEqual(
          expected,
        );
      }
    }
  });

  test("keeps system automatic and defaults to Purple", () => {
    expect(parseAppearance({ active: "system", themes: [], version: 1 })).toEqual({
      mode: "system",
      scheme: "dusk",
      themes: [],
      version: 2,
    });
  });

  test("round-trips each independent mode and color scheme", () => {
    for (const mode of ["system", "light", "dark"] as const) {
      for (const scheme of colorSchemes) {
        const settings: Appearance = { mode, scheme: scheme.id, themes: [], version: 2 };
        expect(parseAppearance(JSON.parse(JSON.stringify(settings)) as unknown)).toEqual(settings);
      }
    }
  });

  test("preserves custom palettes and their saved appearance during migration", () => {
    const custom: CustomTheme = {
      base: "dark",
      colors: {},
      id: "custom-existing",
      name: "My palette",
    };
    const themes: CustomTheme[] = [custom];
    expect(parseAppearance({ active: custom.id, themes, version: 1 })).toEqual({
      mode: "dark",
      scheme: custom.id,
      themes,
      version: 2,
    });
    const settings: Appearance = { mode: "system", scheme: custom.id, themes, version: 2 };
    expect(parseAppearance(settings)).toEqual(settings);
    expect(parseThemeFile(JSON.stringify({ themes, version: 1 }))).toEqual(themes);
  });

  test("falls back for a missing scheme without discarding custom themes or mode", () => {
    const themes: CustomTheme[] = [
      { base: "light", colors: {}, id: "custom-kept", name: "Keep me" },
    ];
    expect(parseAppearance({ mode: "dark", scheme: "missing", themes, version: 2 })).toEqual({
      mode: "dark",
      scheme: "dusk",
      themes,
      version: 2,
    });
  });

  test("rejects invalid modes, versions and unexpected fields", () => {
    const settings: Appearance = { mode: "system", scheme: "dusk", themes: [], version: 2 };
    expect(parseAppearance({ ...settings, mode: "sepia" })).toBeNull();
    expect(parseAppearance({ ...settings, version: 3 })).toBeNull();
    expect(parseAppearance({ ...settings, active: "dusk-dark" })).toBeNull();
  });
});

describe("custom base palettes", () => {
  test("preserves both custom base choices in settings and theme files", () => {
    for (const scheme of colorSchemes) {
      for (const base of ["light", "dark"] as const) {
        const theme: CustomTheme = {
          base,
          baseScheme: scheme.id,
          colors: {},
          id: "custom-based",
          name: "Based palette",
        };
        expect(parseCustomTheme(theme)).toEqual(theme);
        const settings: Appearance = {
          mode: "system",
          scheme: theme.id,
          themes: [theme],
          version: 2,
        };
        expect(parseAppearance(settings)).toEqual(settings);
        expect(parseThemeFile(JSON.stringify({ themes: [theme], version: 1 }))).toEqual([theme]);
      }
    }
  });

  test("rejects invalid custom base schemes without altering legacy themes", () => {
    const legacy: CustomTheme = {
      base: "light",
      colors: {},
      id: "custom-old",
      name: "Old palette",
    };
    expect(parseCustomTheme(legacy)).toEqual(legacy);
    expect(parseCustomTheme({ ...legacy, baseScheme: "unknown" })).toBeNull();
    expect(parseCustomTheme({ ...legacy, baseScheme: null })).toBeNull();
    expect(parseCustomTheme({ ...legacy, baseScheme: "dusk-dark" })).toBeNull();
  });
});
