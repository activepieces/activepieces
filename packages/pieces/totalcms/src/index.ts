
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const totalcms = createPiece({
  displayName: "Totalcms",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/totalcms.png",
  authors: [],
  actions: [],
  triggers: [],
});
