import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { trackEvent } from './lib/actions/track-event';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const mixpanelAuth = PieceAuth.SecretText({
  displayName: 'Mixpanel token',
  required: true,
  description: `
      The Mixpanel token associated with your project. You can find your Mixpanel token in the project settings dialog in the Mixpanel app.
    `,
});

export const mixpanel = createPiece({
  displayName: 'Mixpanel',
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mixpanel.png',
  authors: ['yann120'],
  auth: mixpanelAuth,
  actions: [trackEvent,
    createCustomApiCallAction({
        baseUrl: () => 'https://api.mixpanel.com',
        auth: mixpanelAuth,
        authMapping: (auth) => ({
            'Authorization': `Basic ${Buffer.from(auth as string).toString('base64')}`,
        })
    })
    
],
  triggers: [],
});
