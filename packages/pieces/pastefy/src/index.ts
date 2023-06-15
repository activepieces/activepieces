import { createPiece } from "@activepieces/pieces-framework";
import actions from "./lib/actions";

export const pastefy = createPiece({
  displayName: "Pastefy",
  logoUrl: "https://cdn.activepieces.com/pieces/pastefy.png", // https://interaapps.de/img/pastefy.e1cdf365.png
  authors: ['JanHolger'],
  actions,
  triggers: []
});
