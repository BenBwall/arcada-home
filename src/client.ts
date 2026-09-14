import "$components/appearance-panel.js";
import { applyAppearance, readAppearance } from "$theme/theme.js";
import { CardGame } from "$cardgame";

applyAppearance(readAppearance());

// Mount only on the homepage; the game owns all of its state in this browser tab.
document.getElementById("card-game-mount")?.replaceChildren(new CardGame());
