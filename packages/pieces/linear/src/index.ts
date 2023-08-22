
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const linear = createPiece({
  displayName: "Linear",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.7.1',
  logoUrl: "https://cdn.activepieces.com/pieces/linear.png",
  authors: [],
  actions: [],
  triggers: [],
});
