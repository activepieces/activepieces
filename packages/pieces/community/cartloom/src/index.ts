import { createPiece } from '@activepieces/pieces-framework';
import { getProductsAction } from './lib/actions/get-products';
import { cartloomAuth } from './lib/auth';
import { getOrderAction } from './lib/actions/get-order';
import { createDiscountAction } from './lib/actions/create-discount';
import { getDiscountAction } from './lib/actions/get-discount';
import { getAllDiscountsAction } from './lib/actions/get-discounts';
import { getOrderDateAction } from './lib/actions/get-orders-date';
import { getOrderEmailAction } from './lib/actions/get-orders-date-email';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const cartloom = createPiece({
  displayName: 'Cartloom',
  auth: cartloomAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/cartloom.png',
  authors: ['joeworkman'],
  actions: [
    getProductsAction,
    getOrderAction,
    createDiscountAction,
    getDiscountAction,
    getAllDiscountsAction,
    getOrderDateAction,
    getOrderEmailAction,
    createCustomApiCallAction({
      baseUrl: (auth) => `https://${(auth as { domain: string }).domain}.cartloom.com/api`, // Replace with the actual base URL
      auth: cartloomAuth,
      authMapping: (auth) => ({
        'X-API-KEY': (auth as { apiKey: string }).apiKey,
      }),
    }),
  ],
  triggers: [],
});
