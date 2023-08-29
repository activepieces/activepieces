
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const tally = createPiece({
  displayName: "Tally",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.8.0',
  logoUrl: "https://cdn.activepieces.com/pieces/tally.png",
  authors: [],
  actions: [],
  triggers: [],
});
