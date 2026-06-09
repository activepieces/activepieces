import { createPiece } from '@activepieces/pieces-framework';

import { shippoAuth } from './lib/auth';
import { createOrder } from './lib/actions/create-order';
import { findOrder } from './lib/actions/find-order';
import { findShippingLabel } from './lib/actions/find-shipping-label';
import { newShippingLabel } from './lib/triggers/new-shipping-label';
import { newOrder } from './lib/triggers/new-order';

export const shippo = createPiece({
  displayName: 'Shippo',
  description:
    'Multi-carrier shipping platform for real-time rates, labels, and tracking',
  auth: shippoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/shippo.png',
  authors: ['SinghaAnirban005', 'sanket-a11y'],
  actions: [createOrder, findOrder, findShippingLabel],
  triggers: [newShippingLabel, newOrder],
});
