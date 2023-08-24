import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { webflowNewSubmission } from './lib/triggers/new-form-submitted';

export const webflowAuth = PieceAuth.OAuth2({
  description: "",
  
  authUrl: "https://webflow.com/oauth/authorize",
  tokenUrl: "https://api.webflow.com/oauth/access_token",
  required: true,
  scope: ['webhooks:write', 'forms:read'],
})

export const webflow = createPiece({
  displayName: "Webflow",
      minimumSupportedRelease: '0.5.0',
    logoUrl: "https://cdn.activepieces.com/pieces/webflow.png",
  authors: ['Ahmad-AbuOsbeh'],
  auth: webflowAuth,
  actions: [],
  triggers: [webflowNewSubmission],
});
