
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { askAi } from "./lib/actions/ask-ai";

export const activepiecesAi = createPiece({
  displayName: "AI",
  auth: PieceAuth.None(),
  logoUrl: "https://cdn.activepieces.com/pieces/activepieces-ai.png",
  authors: [],
  actions: [askAi],
  triggers: [],
});
