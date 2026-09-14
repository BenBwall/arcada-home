import { applyAppearance, readAppearance } from "$theme/theme.js";

// Inlined as a classic head script so saved colors apply before the first paint.
applyAppearance(readAppearance());
