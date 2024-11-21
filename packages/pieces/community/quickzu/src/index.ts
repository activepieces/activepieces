import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { updateBusinessTimeAction } from './lib/actions/business-settings/update-business-time';
import { createCategoryAction } from './lib/actions/categories/create-category';
import { deleteCategoryAction } from './lib/actions/categories/delete-category';
import { listCategoriesAction } from './lib/actions/categories/list-categories';
import { updateCategoryAction } from './lib/actions/categories/update-category';
import { createProductDiscountAction } from './lib/actions/discounts/create-product-discount';
import { createPromoCodeAction } from './lib/actions/discounts/create-promo-code';
import { getOrderDetailsAction } from './lib/actions/orders/get-order-details';
import { listLiveOrdersAction } from './lib/actions/orders/list-live-orders';
import { listOrdersAction } from './lib/actions/orders/list-orders';
import { updateOrderStatusAction } from './lib/actions/orders/update-order-status';
import { addProductAction } from './lib/actions/products/create-product';
import { deleteProductAction } from './lib/actions/products/delete-product';
import { listProductsAction } from './lib/actions/products/list-products';
import { updateProductAction } from './lib/actions/products/update-product';
import { orderCreatedTrigger } from './lib/triggers/order-created';

const authHelpDescription = `
1. Login to your Quickzu Dashboard.
2. Go to **https://app.quickzu.com/dash/settings/api-webhooks**.
3. Copy **API Token** to the clipboard and paste it.`;

export const quickzuAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: authHelpDescription,
  required: true,
});

export const quickzu = createPiece({
  displayName: 'Quickzu',
  description: 'Streamline ordering from whatsapp',

  auth: quickzuAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/quickzu.png',
  authors: ["kishanprmr","abuaboud"],
  actions: [
    addProductAction,
    updateProductAction,
    deleteProductAction,
    listProductsAction,
    createCategoryAction,
    updateCategoryAction,
    deleteCategoryAction,
    listCategoriesAction,
    getOrderDetailsAction,
    listOrdersAction,
    listLiveOrdersAction,
    updateOrderStatusAction,
    createProductDiscountAction,
    createPromoCodeAction,
    updateBusinessTimeAction,
  ],
  triggers: [orderCreatedTrigger],
});
