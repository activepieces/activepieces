import { createPiece, PieceAuth } from "@activepieces/pieces-framework"

export const shortio = createPiece({
  displayName: "Shortio",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/shortio.png",
  authors: [],
  actions: [],
  triggers: [],
});
