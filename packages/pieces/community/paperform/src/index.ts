import { createPiece, PieceAuth } from "@activepieces/pieces-framework"

export const paperform = createPiece({
  displayName: "Paperform",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/paperform.png",
  authors: [],
  actions: [],
  triggers: [],
});
    