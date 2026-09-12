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
} from "./theme-schema";

export const readAppearance = (): Appearance => {
  const fallback: Appearance = { active: "system", themes: [], version: 1 };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    // Migrate the original light/dark preference when no new settings exist.
    if (stored === null) {
      const legacy = localStorage.getItem("theme");
      return { ...fallback, active: isTheme(legacy) ? legacy : "system" };
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

export const applyTheme = (base: Theme, colors: Partial<Colors> = {}): void => {
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

export const applyAppearance = (appearance: Appearance): void => {
  const custom = appearance.themes.find((theme) => theme.id === appearance.active);

  if (custom) {
    applyTheme(custom.base, custom.colors);
    return;
  }

  const base = isTheme(appearance.active) ? appearance.active : getSystemTheme();
  applyTheme(base);
};

export const importThemes = (text: string): CustomTheme[] => {
  const themes = parseThemeFile(text);

  // Import copies so existing saved themes are never overwritten.
  return themes.map((theme) => ({
    ...theme,
    id: `custom-${crypto.randomUUID()}`,
  }));
};
