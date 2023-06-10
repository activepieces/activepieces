
import { createPiece } from "@activepieces/pieces-framework";
import actions from "./lib/actions";

export const pastebin = createPiece({
  displayName: "Pastebin",
  logoUrl: "https://cdn.activepieces.com/pieces/pastebin.png",
  authors: ['JanHolger'],
  actions,
  triggers: [],
});
