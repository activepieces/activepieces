import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { createConversationAction } from './lib/actions/create-conversation';
import { createCustomerAction } from './lib/actions/create-customer';
import { getCustomerAction } from './lib/actions/get-customer';
import { getCustomObjectsAction } from './lib/actions/get-custom-objects';
import { updateConversationAction } from './lib/actions/update-conversation';
import { kustomerAuth } from './lib/common/auth';
import { KUSTOMER_API_BASE_URL, kustomerClient } from './lib/common/client';

export const kustomer = createPiece({
  displayName: 'Kustomer',
  description:
    'Create and manage Kustomer customers, conversations, and custom objects.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/kustomer.png',
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  authors: ['veri5ied', 'sanket-a11y'],
  auth: kustomerAuth,
  actions: [
    createCustomerAction,
    createConversationAction,
    updateConversationAction,
    getCustomerAction,
    getCustomObjectsAction,
    createCustomApiCallAction({
      auth: kustomerAuth,
      baseUrl: () => KUSTOMER_API_BASE_URL,
      authMapping: async (auth) => {
        const apiKey = auth.secret_text as string;
        return kustomerClient.createAuthHeaders({
          apiKey,
        });
      },
    }),
  ],
  triggers: [],
});
