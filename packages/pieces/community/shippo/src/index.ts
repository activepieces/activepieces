  import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
  import { PieceCategory } from '@activepieces/shared';
  import { createOrder } from './lib/actions/create-order';
  import { findOrder } from './lib/actions/find-order';
  import { findShippingLabel } from './lib/actions/find-shipping-label';
  import { newOrder } from './lib/triggers/new-order';
  import { newShippingLabel } from './lib/triggers/new-shipping-label';

  export const shippoAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: 'Enter your Shippo API key. You can get your API key from your Shippo dashboard at https://goshippo.com/',
    required: true,
    validate: async ({ auth }) => {
      if (!auth || auth.length < 10) {
        return {
          valid: false,
          error: 'Invalid API Key'
        };
      }
      return {
        valid: true
      };
    }
  });

  export const shippo = createPiece({
    displayName: 'Shippo',
    description: 'Multi-carrier shipping platform and API',
    auth: shippoAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/shippo.png',
    categories: [PieceCategory.COMMERCE],
    authors: ['onyedikachi-david'],
    actions: [
      createOrder,
      findOrder,
      findShippingLabel,
    ],
    triggers: [
      newOrder,
      newShippingLabel,
    ],
  });

