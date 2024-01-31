import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { typeformNewSubmission } from './lib/trigger/new-submission';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

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
  actions: [
    createCustomApiCallAction({
      baseUrl: () => 'https://api.typeform.com',
      auth: typeformAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  auth: typeformAuth,
  authors: ['ShahedAlMashni'],
  triggers: [typeformNewSubmission],
});
