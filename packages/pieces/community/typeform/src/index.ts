import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { typeformNewSubmission } from './lib/trigger/new-submission';

export const typeformAuth = PieceAuth.OAuth2({
  required: true,
  tokenUrl: 'https://api.typeform.com/oauth/token',
  authUrl: 'https://admin.typeform.com/oauth/authorize',
  scope: ['webhooks:write', 'forms:read'],
});

export const typeform = createPiece({
  displayName: 'Typeform',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/typeform.png',
  actions: [],
  auth: typeformAuth,
  authors: ['ShahedAlMashni'],
  triggers: [typeformNewSubmission],
});
