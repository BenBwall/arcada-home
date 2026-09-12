export type Theme = "light" | "dark";

export const STORAGE_KEY = "appearance-v1";
export const MAX_THEMES = 512;
export const MAX_IMPORT_BYTES = 65_536;
export const MAX_IMPORT_BYTES_HUMAN_READABLE = "64 KB";
export const MAX_NAME_LENGTH = 128;

export const colorFields = [
  { key: "background", label: "Background", property: "--color-background" },
  { key: "surface", label: "Surface", property: "--color-surface" },
  { key: "text", label: "Text", property: "--color-text" },
  { key: "muted", label: "Muted text", property: "--color-muted" },
  { key: "primary", label: "Primary color", property: "--color-primary" },
  { key: "secondary", label: "Secondary color", property: "--color-secondary" },
  { key: "accent", label: "Accent color", property: "--color-accent" },
  { key: "border", label: "Borders", property: "--color-border" },
  {
    key: "border-strong",
    label: "Strong borders",
    property: "--color-border-strong",
  },
  { key: "hover", label: "Hover background", property: "--color-hover" },
  { key: "active", label: "Pressed background", property: "--color-active" },
  { key: "shadow", label: "Shadows and backdrop", property: "--color-shadow" },
  {
    key: "nav-active-background",
    label: "Active navigation background",
    property: "--nav-active-background",
  },
  {
    key: "nav-active-text",
    label: "Active navigation text",
    property: "--nav-active-text",
  },
] as const;

export type ColorKey = (typeof colorFields)[number]["key"];
export type Colors = Record<ColorKey, string>;

export type CustomTheme = {
  id: string;
  name: string;
  base: Theme;
  colors: Partial<Colors>;
};

export type Appearance = {
  version: 1;
  active: string;
  themes: CustomTheme[];
};

export const isTheme = (value: unknown): value is Theme => value === "light" || value === "dark";

export const isCssColor = (value: unknown): value is string =>
  typeof value === "string" && typeof CSS !== "undefined" && CSS.supports("color", value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOnlyKeys = (value: Record<string, unknown>, allowedKeys: string[]): boolean =>
  Object.keys(value).every((key) => allowedKeys.includes(key));

const colorKeys = colorFields.map((field) => field.key);

const parseColors = (value: unknown): Partial<Colors> | null => {
  if (!isRecord(value) || !hasOnlyKeys(value, colorKeys)) {
    return null;
  }

  const colors: Partial<Colors> = {};

  for (const key of colorKeys) {
    const color = value[key];
    if (color === undefined) {
      continue;
    }
    if (!isCssColor(color)) {
      return null;
    }
    colors[key] = color.trim();
  }

  return colors;
};

export const parseCustomTheme = (value: unknown): CustomTheme | null => {
  if (!isRecord(value) || !hasOnlyKeys(value, ["id", "name", "base", "colors"] as const)) {
    return null;
  }
  if (typeof value.id !== "string" || !/^custom-[\w-]{1,80}$/.test(value.id)) {
    return null;
  }
  if (typeof value.name !== "string" || value.name.length > MAX_NAME_LENGTH) {
    return null;
  }
  if (!value.name.trim() || !isTheme(value.base)) {
    return null;
  }

  const colors = parseColors(value.colors);
  if (!colors) {
    return null;
  }

  return { base: value.base, colors, id: value.id, name: value.name.trim() };
};

const parseThemeList = (value: unknown): CustomTheme[] | null => {
  if (!Array.isArray(value) || value.length > MAX_THEMES) {
    return null;
  }

  const themes: CustomTheme[] = [];
  const ids = new Set<string>();

  for (const item of value) {
    const theme = parseCustomTheme(item);
    if (!theme || ids.has(theme.id)) {
      return null;
    }
    themes.push(theme);
    ids.add(theme.id);
  }

  return themes;
};

export const parseAppearance = (value: unknown): Appearance | null => {
  if (!isRecord(value) || !hasOnlyKeys(value, ["version", "active", "themes"] as const)) {
    return null;
  }
  if (value.version !== 1 || typeof value.active !== "string") {
    return null;
  }

  const themes = parseThemeList(value.themes);
  if (!themes) {
    return null;
  }

  const isBuiltIn = value.active === "system" || isTheme(value.active);
  const isCustom = themes.some((theme) => theme.id === value.active);
  const active = isBuiltIn || isCustom ? value.active : "system";

  return { active, themes, version: 1 };
};

export const parseThemeFile = (text: string): CustomTheme[] => {
  if (text.length > MAX_IMPORT_BYTES) {
    throw new Error(`Choose a theme file smaller than ${MAX_IMPORT_BYTES_HUMAN_READABLE}.`);
  }

  const value: unknown = JSON.parse(text);
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["version", "themes"] as const) ||
    value.version !== 1
  ) {
    throw new Error("This is not a supported theme file.");
  }

  const themes = parseThemeList(value.themes);
  if (!themes?.length) {
    throw new Error(
      "The file must contain valid themes with CSS colors supported by this browser.",
    );
  }

  return themes;
};
