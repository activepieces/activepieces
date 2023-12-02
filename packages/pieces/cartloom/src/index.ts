
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const cartloom = createPiece({
  displayName: "Cartloom",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/cartloom.png",
  authors: [],
  actions: [],
  triggers: [],
});
