import "$components/appearance-panel.js";
import { applyAppearance, readAppearance } from "$theme/theme.js";
import { CardGame } from "$cardgame";

applyAppearance(readAppearance());

// The page provides the separately hosted multiplayer origin at build time.
const mount = document.getElementById("card-game-mount");
if (mount) {
  const game = new CardGame();
  game.multiplayerUrl = mount.dataset.multiplayerUrl ?? "";
  mount.replaceChildren(game);
}
