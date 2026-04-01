import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { searchProductsAction } from './lib/actions/search-products';
import { getProductDetailsAction } from './lib/actions/get-product-details';
import { getCurrentOffersAction } from './lib/actions/get-current-offers';
import { getPriceHistoryAction } from './lib/actions/get-price-history';
import { priceDropTrigger } from './lib/triggers/price-drop';
import { shopsavvyAuth } from './lib/common/auth';

export const shopsavvy = createPiece({
  displayName: 'ShopSavvy',
  description:
    'Search products, compare prices across retailers, and track price history with ShopSavvy.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/shopsavvy.png',
  categories: [PieceCategory.COMMERCE],
  authors: ['shopsavvy'],
  auth: shopsavvyAuth,
  actions: [
    searchProductsAction,
    getProductDetailsAction,
    getCurrentOffersAction,
    getPriceHistoryAction,
    createCustomApiCallAction({
      auth: shopsavvyAuth,
      baseUrl: () => 'https://api.shopsavvy.com/v1',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth as string}`,
      }),
    }),
  ],
  triggers: [priceDropTrigger],
});

export { shopsavvyAuth };
