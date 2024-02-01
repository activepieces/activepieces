import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createDiscountAction } from './lib/actions/create-discount';
import { getDiscountAction } from './lib/actions/get-discount';
import { getAllDiscountsAction } from './lib/actions/get-discounts';
import { getOrderAction } from './lib/actions/get-order';
import { getOrderDateAction } from './lib/actions/get-orders-date';
import { getOrderEmailAction } from './lib/actions/get-orders-date-email';
import { getProductsAction } from './lib/actions/get-products';
import { cartloomAuth } from './lib/auth';

export const cartloom = createPiece({
  displayName: 'Cartloom',
  auth: cartloomAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/cartloom.png',
  categories: [PieceCategory.COMMERCE],
  authors: ['joeworkman'],
  actions: [
    getProductsAction,
    getOrderAction,
    createDiscountAction,
    getDiscountAction,
    getAllDiscountsAction,
    getOrderDateAction,
    getOrderEmailAction,
  ],
  triggers: [],
});
