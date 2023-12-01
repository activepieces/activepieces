
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const bettermode = createPiece({
  displayName: "Bettermode",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/bettermode.png",
  authors: ["joeworkman"],
  actions: [
  ],
  triggers: [],
});
