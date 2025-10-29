import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { bigcommerceAuth } from "./lib/common/common";
import { createCustomerAction } from "./lib/actions/create-customer";
import { createProductAction } from "./lib/actions/create-a-product";
import { createBlogPostAction } from "./lib/actions/create-blog-post";
import { createCustomerAddressAction } from "./lib/actions/create-customer-address";
import { apiRequestAction } from "./lib/actions/api-request";
import { searchCustomerAction } from "./lib/actions/search-customer";
import { searchCustomerAddressAction } from "./lib/actions/search-customer-address";
import { searchProductAction } from "./lib/actions/search-product";
import { findOrCreateCustomerAction } from "./lib/actions/find-or-create-customer";
import { findOrCreateCustomerAddressAction } from "./lib/actions/find-or-create-customer's-addess";
import { findOrCreateProductAction } from "./lib/actions/find-or-create-product";
import { abandonedCartTrigger } from "./lib/triggers/abandoned-cart";
import { cartCreatedTrigger } from "./lib/triggers/cart-created";
import { customerAddressCreatedTrigger } from "./lib/triggers/customer-address-created";
import { customerAddressUpdatedTrigger } from "./lib/triggers/customer-address-updated";
import { customerCreatedTrigger } from "./lib/triggers/customer-created";
import { customerUpdatedTrigger } from "./lib/triggers/customer-updated";
import { orderCreatedTrigger } from "./lib/triggers/order-created";
import { orderUpdatedTrigger } from "./lib/triggers/order-updated";
import { orderStatusUpdatedTrigger } from "./lib/triggers/order-status-updated";
import { productCreatedTrigger } from "./lib/triggers/product-created";
import { shipmentCreatedTrigger } from "./lib/triggers/shipment-created";
export const bigcommerce = createPiece({
  displayName: 'BigCommerce',
  description: 'E-commerce platform for creating and managing online stores',
  auth: bigcommerceAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bigcommerce.png',
  categories: [PieceCategory.COMMERCE],
  authors: ['Ani-4x'],
  actions: [
    createCustomerAction,
    createProductAction,
    createBlogPostAction,
    createCustomerAddressAction,
    apiRequestAction,
    searchCustomerAction,
    searchProductAction,
    searchCustomerAddressAction,
    findOrCreateCustomerAction,
    findOrCreateProductAction,
    findOrCreateCustomerAddressAction,
  ],
  triggers: [
    abandonedCartTrigger,
    cartCreatedTrigger,
    customerCreatedTrigger,
    customerUpdatedTrigger,
    customerAddressCreatedTrigger,
    customerAddressUpdatedTrigger,
    orderCreatedTrigger,
    orderUpdatedTrigger,
    orderStatusUpdatedTrigger,
    productCreatedTrigger,
    shipmentCreatedTrigger,
  ],
});