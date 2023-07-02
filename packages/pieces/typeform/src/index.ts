import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { typeformNewSubmission } from './lib/trigger/new-submission';

export const typeformAuth = PieceAuth.OAuth2({
  displayName: "Authentication",
  required: true,
  tokenUrl: 'https://api.typeform.com/oauth/token',
  authUrl: 'https://admin.typeform.com/oauth/authorize',
  scope: ['webhooks:write', 'forms:read'],
})

export const typeform = createPiece({
  displayName: 'TypeForm',
  logoUrl: 'https://cdn.activepieces.com/pieces/typeform.png',
  actions: [],
  auth: typeformAuth,
  authors: ['ShahedAlMashni'],
  triggers: [typeformNewSubmission],
});
