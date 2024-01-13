
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const baserow = createPiece({
  displayName: "Baserow",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/baserow.png",
  authors: [],
  actions: [],
  triggers: [],
});
