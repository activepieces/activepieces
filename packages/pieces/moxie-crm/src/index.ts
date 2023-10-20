
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const moxieCrm = createPiece({
  displayName: "Moxie-crm",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/moxie-crm.png",
  authors: [],
  actions: [],
  triggers: [],
});
