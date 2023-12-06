
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const clearout = createPiece({
  displayName: "Clearout",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/clearout.png",
  authors: [],
  actions: [],
  triggers: [],
});
