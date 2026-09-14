import { type Colors, colorFields } from "$theme/theme-schema.js";

export type OklchChannels = readonly [number, number, number, number];
const PERCENT_MAX = 100;
const HUE_MAX = 360;
const DISPLAY_PRECISION = 6;
const tidy = (value: number): number => Number(value.toFixed(DISPLAY_PRECISION));

/** Parses the browser's computed, absolute OKLCH serialization. */
export const oklchChannels = (color: string): OklchChannels => {
  const [lightness = "0", chroma = "0", hue = "0", alpha = "1"] = color
    .slice("oklch(".length, -1)
    .trim()
    .split(/[\s/]+/);
  return [
    tidy(Number(lightness) * PERCENT_MAX),
    Number(chroma),
    Number(hue),
    tidy(Number(alpha) * PERCENT_MAX),
  ];
};

export const formatOklch = (channels: OklchChannels): string =>
  channels[3] === PERCENT_MAX
    ? `oklch(${channels[0]}% ${channels[1]} ${channels[2]})`
    : `oklch(${channels[0]}% ${channels[1]} ${channels[2]} / ${channels[3]}%)`;

/**
 * Resolve theme colors directly in OKLCH, preserving gamut and alpha.
 * Relative color syntax lets the browser convert supported CSS color formats
 * without clipping them through an sRGB canvas or quantizing alpha to 8 bits.
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch
 */
export const readCurrentColors = (): Partial<Colors> => {
  const probe = document.createElement("span");
  probe.hidden = true;
  document.body.append(probe);
  const colors: Partial<Colors> = {};
  const themeStyle = getComputedStyle(document.documentElement);

  try {
    for (const { key, property } of colorFields) {
      // Convert before serialization so legacy RGB serialization cannot round alpha.
      probe.style.setProperty("color", `oklch(from var(${property}) l c h / alpha)`, "important");
      const resolved = getComputedStyle(probe).color;
      // Preserve the authored upper endpoint: CSS serializes 360 degrees as 0.
      const source = themeStyle.getPropertyValue(property).trim();
      const hue = /^oklch\(\s*\S+\s+\S+\s+([+\d.e-]+)(?:deg)?\s*(?:\/|\))/i.exec(source)?.[1];
      colors[key] =
        Number(hue) === HUE_MAX
          ? resolved.replace(
              /^(oklch\(\S+\s+\S+\s+)0(?=[\s/)])/,
              (_match, prefix: string) => `${prefix}${HUE_MAX}`,
            )
          : resolved;
    }
    return colors;
  } finally {
    probe.remove();
  }
};
