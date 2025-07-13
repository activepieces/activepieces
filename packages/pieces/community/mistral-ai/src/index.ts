
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const mistralAi = createPiece({
  displayName: "Mistral-ai",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/mistral-ai.png",
  authors: [],
  actions: [],
  triggers: [],
});
