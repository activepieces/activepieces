import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { webflowNewSubmission } from './lib/triggers/new-form-submitted';

export const webflowAuth = PieceAuth.OAuth2({
  description: "",
  displayName: 'Authentication',
  authUrl: "https://webflow.com/oauth/authorize",
  tokenUrl: "https://api.webflow.com/oauth/access_token",
  required: true,
  scope: ['webhooks:write', 'forms:read'],
})

export const webflow = createPiece({
  displayName: "Webflow",
  logoUrl: "https://cdn.activepieces.com/pieces/webflow.png",
  authors: ['Ahmad-AbuOsbeh'],
  auth: webflowAuth,
  actions: [],
  triggers: [webflowNewSubmission],
});
