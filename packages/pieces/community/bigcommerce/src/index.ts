
import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { bigcommerceAuth, BigCommerceAuth } from "./lib/common/auth";
import { getBigCommerceApiUrl } from "./lib/common/client";

import { createCustomer } from "./lib/actions/create-customer";
import { createProduct } from "./lib/actions/create-product";
import { createBlogPost } from "./lib/actions/create-blog-post";
import { createCustomerAddress } from "./lib/actions/create-customer-address";
import { searchCustomer } from "./lib/actions/search-customer";
import { searchProduct } from "./lib/actions/search-product";
import { searchCustomerAddress } from "./lib/actions/search-customer-address";
import { findOrCreateCustomer } from "./lib/actions/find-or-create-customer";
import { findOrCreateProduct } from "./lib/actions/find-or-create-product";
import { findOrCreateCustomerAddress } from "./lib/actions/find-or-create-customer-address";

import { abandonedCart } from "./lib/triggers/abandoned-cart";
import { cartCreated } from "./lib/triggers/cart-created";
import { customerCreated } from "./lib/triggers/customer-created";
import { customerUpdated } from "./lib/triggers/customer-updated";
import { customerAddressCreated } from "./lib/triggers/customer-address-created";
import { customerAddressUpdated } from "./lib/triggers/customer-address-updated";
import { orderCreated } from "./lib/triggers/order-created";
import { orderUpdated } from "./lib/triggers/order-updated";
import { orderStatusUpdated } from "./lib/triggers/order-status-updated";
import { productCreated } from "./lib/triggers/product-created";
import { shipmentCreated } from "./lib/triggers/shipment-created"; 

export const bigcommerce = createPiece({
    displayName: "BigCommerce",
    auth: bigcommerceAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/bigcommerce.png",
    categories: [PieceCategory.COMMERCE],
    authors: ['pranay-verma62'],
    actions: [
        createCustomer,
        createProduct,
        createBlogPost,
        createCustomerAddress,
        searchCustomer,
        searchProduct,
        searchCustomerAddress,
        findOrCreateCustomer,
        findOrCreateProduct,
        findOrCreateCustomerAddress,
        createCustomApiCallAction({
            displayName: "API Request (Beta)",
            description: "Makes a raw HTTP request with BigCommerce authentication. Perform advanced or custom API operations not yet available as native actions.",
            auth: bigcommerceAuth,
            baseUrl: (auth) => {
                const storeHash = (auth as BigCommerceAuth).storeHash;
                return getBigCommerceApiUrl(storeHash);
            },
            authMapping: async (auth) => {
                const { accessToken } = auth as BigCommerceAuth;
                return {
                    'X-Auth-Token': accessToken,
                    'Accept': 'application/json'
                }
            }
        })
    ],
    triggers: [
        abandonedCart,
        cartCreated,
        customerCreated,
        customerUpdated,
        customerAddressCreated,
        customerAddressUpdated,
        orderCreated,
        orderUpdated,
        orderStatusUpdated,
        productCreated,
        shipmentCreated 
    ],
});