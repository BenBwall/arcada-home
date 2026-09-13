import { type BuiltInThemeId, DEFAULT_SCHEME, getColorScheme } from "$theme/built-in-themes";

import {
  type Appearance,
  type Colors,
  type CustomTheme,
  MAX_IMPORT_BYTES,
  STORAGE_KEY,
  type Theme,
  colorFields,
  isCssColor,
  isTheme,
  parseAppearance,
  parseThemeFile,
} from "$theme/theme-schema";

export const readAppearance = (): Appearance => {
  const fallback: Appearance = { mode: "system", scheme: DEFAULT_SCHEME, themes: [], version: 2 };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    // Migrate the original light/dark preference when no new settings exist.
    if (stored === null) {
      const legacy = localStorage.getItem("theme");
      return isTheme(legacy) ? { ...fallback, mode: legacy, scheme: "classic" } : fallback;
    }
    if (stored.length > MAX_IMPORT_BYTES) {
      return fallback;
    }

    return parseAppearance(JSON.parse(stored) as unknown) ?? fallback;
  } catch {
    // Invalid data or unavailable storage should not prevent rendering.
    return fallback;
  }
};

export const saveAppearance = (appearance: Appearance): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
    localStorage.removeItem("theme");
    return true;
  } catch {
    return false;
  }
};

export const getSystemTheme = (): Theme => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

export const resolveBuiltInTheme = (appearance: Appearance): BuiltInThemeId => {
  const mode = appearance.mode === "system" ? getSystemTheme() : appearance.mode;
  const scheme = getColorScheme(appearance.scheme) ?? getColorScheme(DEFAULT_SCHEME);
  return scheme?.[mode] ?? (mode === "dark" ? "dusk-dark" : "dusk-light");
};

export const applyTheme = (base: BuiltInThemeId, colors: Partial<Colors> = {}): void => {
  const root = document.documentElement;
  root.dataset.theme = base;

  for (const { key, property } of colorFields) {
    const color = colors[key];

    if (isCssColor(color)) {
      root.style.setProperty(property, color);
    } else {
      root.style.removeProperty(property);
    }
  }
};

export const applyCustomTheme = (theme: CustomTheme): void => {
  // Older custom themes used the neutral palette as their base and keep that behavior.
  const base = getColorScheme(theme.baseScheme ?? "classic")?.[theme.base] ?? theme.base;
  applyTheme(base, theme.colors);
};

export const applyAppearance = (appearance: Appearance): void => {
  const custom = appearance.themes.find((theme) => theme.id === appearance.scheme);

  if (custom) {
    applyCustomTheme(custom);
    return;
  }

  applyTheme(resolveBuiltInTheme(appearance));
};

export const importThemes = (text: string): CustomTheme[] => {
  const themes = parseThemeFile(text);

  // Import copies so existing saved themes are never overwritten.
  return themes.map((theme) => ({
    ...theme,
    id: `custom-${crypto.randomUUID()}`,
  }));
};
