import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { newResponse } from './lib/triggers/new-form-response';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const googleFormsAuth = PieceAuth.OAuth2({
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/forms.responses.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
  ],
});

export const googleForms = createPiece({
  displayName: 'Google Forms',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-forms.png',
  authors: ['abuaboud'],
  auth: googleFormsAuth,
  actions: [
    createCustomApiCallAction({
      baseUrl: () => 'https://forms.googleapis.com/v1',
      auth: googleFormsAuth,
      authMapping: (auth) => ({
        'Authorization': `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newResponse],
});
