import { applyAppearance, readAppearance } from "$theme/theme";
import type { ClientInit } from "@sveltejs/kit";

export const init: ClientInit = () => {
  applyAppearance(readAppearance());
};
