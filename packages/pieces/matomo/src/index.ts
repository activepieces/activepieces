
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const matomo = createPiece({
  displayName: "Matomo",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/matomo.png",
  authors: [],
  actions: [],
  triggers: [],
});
