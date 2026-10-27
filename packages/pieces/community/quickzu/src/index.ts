import { createPiece } from '@activepieces/pieces-framework';
import { updateBusinessTimeAction } from './lib/actions/business-settings/update-business-time';
import { createCategoryAction } from './lib/actions/categories/create-category';
import { deleteCategoryAction } from './lib/actions/categories/delete-category';
import { listCategoriesAction } from './lib/actions/categories/list-categories';
import { updateCategoryAction } from './lib/actions/categories/update-category';
import { createProductDiscountAction } from './lib/actions/discounts/create-product-discount';
import { createPromoCodeAction } from './lib/actions/discounts/create-promo-code';
import { aiCreateProductDiscountAction } from './lib/actions/discounts/ai-create-product-discount';
import { aiCreatePromoCodeAction } from './lib/actions/discounts/ai-create-promo-code';
import { getOrderDetailsAction } from './lib/actions/orders/get-order-details';
import { listLiveOrdersAction } from './lib/actions/orders/list-live-orders';
import { listOrdersAction } from './lib/actions/orders/list-orders';
import { updateOrderStatusAction } from './lib/actions/orders/update-order-status';
import { addProductAction } from './lib/actions/products/create-product';
import { deleteProductAction } from './lib/actions/products/delete-product';
import { listProductsAction } from './lib/actions/products/list-products';
import { updateProductAction } from './lib/actions/products/update-product';
import { orderCreatedTrigger } from './lib/triggers/order-created';
import { quickzuAuth } from './lib/auth';

export const quickzu = createPiece({
  displayName: 'Quickzu',
  description: 'Streamline ordering from whatsapp',

  auth: quickzuAuth,
  minimumSupportedRelease: '0.86.4',
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
    aiCreateProductDiscountAction,
    aiCreatePromoCodeAction,
    updateBusinessTimeAction,
  ],
  triggers: [orderCreatedTrigger],
});
