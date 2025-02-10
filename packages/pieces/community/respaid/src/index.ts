import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { respaidActions } from "./lib/actions";
import { respaidTriggers } from "./lib/triggers";

export const respaidAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'You can find API Key in your Respaid account',
});
    
export const respaid = createPiece({
  displayName: "Respaid",
  auth: respaidAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/respaid.jpg",
  authors: [],
  actions: respaidActions,
  triggers: respaidTriggers,
});
    