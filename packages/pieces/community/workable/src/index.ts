
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const workableAuth = PieceAuth.SecretText({
    displayName: "API Key",
    description: "Enter API Key",
    required: true
  })


export const workable = createPiece({
  displayName: "Workable",
  auth: workableAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/workable.png",
  authors: [],
  actions: [],
  triggers: [],
});
