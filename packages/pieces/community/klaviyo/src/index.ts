import { createPiece } from '@activepieces/pieces-framework';
import { klaviyoAuth } from './lib/auth';

export const klaviyo = createPiece({
  displayName: 'Klaviyo',
  description: 'Integration with Klaviyo marketing platform',
  auth: klaviyoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/klaviyo.png',
  authors: ['Activepieces Team <support@activepieces.com>'],
  triggers: [],
  actions: []
});