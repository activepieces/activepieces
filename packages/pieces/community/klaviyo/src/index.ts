import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  description: 'Integration with Klaviyo for managing profiles, lists, and events',
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
    description: 'Private API Key for Klaviyo',
  }),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  authors: ['Your Name <you@example.com>'],
  triggers: [],
  actions: [],
  searches: [],
});
