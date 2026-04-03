import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { createAccountAction } from './lib/actions/create-account';
import { createSubscriptionAction } from './lib/actions/create-subscription';
import { getAccountAction } from './lib/actions/get-account';
import { listSubscriptionsAction } from './lib/actions/list-subscriptions';
import { recurlyAuth } from './lib/common/auth';
import { getBasicAuthHeader } from './lib/common/client';

export const recurly = createPiece({
  displayName: 'Recurly',
  description:
    'Subscription billing and recurring revenue platform for accounts and subscriptions.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/recurly.png',
  categories: [PieceCategory.COMMERCE, PieceCategory.PAYMENT_PROCESSING],
  authors: ['veri5ied'],
  auth: recurlyAuth,
  actions: [
    createAccountAction,
    createSubscriptionAction,
    getAccountAction,
    listSubscriptionsAction,
    createCustomApiCallAction({
      auth: recurlyAuth,
      baseUrl: () => 'https://v3.recurly.com',
      authMapping: async (auth) => ({
        Authorization: getBasicAuthHeader(auth),
      }),
    }),
  ],
  triggers: [],
});

export { recurlyAuth };
