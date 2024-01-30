import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { asanaCreateTaskAction } from './lib/actions/create-task';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const asanaAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://app.asana.com/-/oauth_authorize',
  tokenUrl: 'https://app.asana.com/-/oauth_token',
  required: true,
  scope: ['default'],
});

export const asana = createPiece({
  displayName: 'Asana',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/asana.png',
  authors: ['abuaboud'],
  auth: asanaAuth,
  actions: [asanaCreateTaskAction,
    createCustomApiCallAction({
        baseUrl: () => `https://app.asana.com/api/1.0`,
        auth: asanaAuth,
        authMapping: (auth) => ({
          'Authorization': `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        })
      })
],
  triggers: [],
});
