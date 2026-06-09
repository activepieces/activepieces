import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { katanaAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/constants';
import { createCustomer } from './lib/actions/create-customer';
import { createSalesOrder } from './lib/actions/create-sales-order';
import { findCustomer } from './lib/actions/find-customer';

export const katana = createPiece({
  displayName: 'Katana',
  auth: katanaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/katana.png',
  description:
    'Katana is a cloud-based manufacturing ERP software for inventory, production, and order management.',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["onyedikachi-david"],
  actions: [
    createCustomer,
    createSalesOrder,
    findCustomer,
    createCustomApiCallAction({
      auth: katanaAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
