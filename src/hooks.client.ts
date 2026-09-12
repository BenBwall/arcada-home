import { applyAppearance, readAppearance } from "$lib/theme/theme";
import type { ClientInit } from "@sveltejs/kit";

export const init: ClientInit = () => {
  applyAppearance(readAppearance());
};
