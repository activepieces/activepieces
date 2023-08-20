
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const nitfy = createPiece({
  displayName: "Nitfy",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.7.1',
  logoUrl: "https://cdn.activepieces.com/pieces/nitfy.png",
  authors: [],
  actions: [],
  triggers: [],
});
