
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const sessions = createPiece({
  displayName: "Sessions",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.8.0',
  logoUrl: "https://cdn.activepieces.com/pieces/sessions.png",
  authors: [],
  actions: [],
  triggers: [],
});
