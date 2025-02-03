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
  logoUrl: "https://cdn.prod.website-files.com/6633d7e9bd4516c8fbe711be/6642b52b31103ce1aca6428d_Respaid.svg",
  authors: [],
  actions: respaidActions,
  triggers: respaidTriggers,
});
    