
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const extractText = createPiece({
  displayName: "Extract-text",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.8.0',
  logoUrl: "https://cdn.activepieces.com/pieces/extract-text.png",
  authors: [],
  actions: [],
  triggers: [],
});
