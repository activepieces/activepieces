
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const retable = createPiece({
  displayName: "Retable",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/retable.png",
  authors: [],
  actions: [],
  triggers: [],
});
