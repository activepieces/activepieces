import { createPiece } from "@activepieces/pieces-framework";
import actions from "./lib/actions";
import triggers from "./lib/triggers";

export const pastefy = createPiece({
  displayName: "Pastefy",
  logoUrl: "https://cdn.activepieces.com/pieces/pastefy.png",
  authors: ['JanHolger'],
  actions,
  triggers: triggers
});
