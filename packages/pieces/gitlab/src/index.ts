
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const gitlab = createPiece({
  displayName: "Gitlab",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.7.1',
  logoUrl: "https://cdn.activepieces.com/pieces/gitlab.png",
  authors: [],
  actions: [],
  triggers: [],
});
