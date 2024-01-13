import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { newCancelledOrder } from './lib/triggers/new-cancelled-order';
import { newCustomer } from './lib/triggers/new-customer';
import { newOrder } from './lib/triggers/new-order';
import { newPaidOrder } from './lib/triggers/new-paid-order';
import { HttpMethod } from '@activepieces/pieces-common';
import { createCustomerAction } from './lib/actions/create-customer';
import { getCustomerAction } from './lib/actions/get-customer';
import { updateCustomerAction } from './lib/actions/update-customer';
import { getCustomerOrdersAction } from './lib/actions/get-customer-orders';
import { sendShopifyRequest } from './lib/common';
import { createProductAction } from './lib/actions/create-product';
import { getProductsAction } from './lib/actions/get-products';
import { updatedProduct } from './lib/triggers/updated-product';
import { createDraftOrderAction } from './lib/actions/create-draft-order';
import { createOrderAction } from './lib/actions/create-order';
import { createTransactionAction } from './lib/actions/create-transaction';
import { getTransactionAction } from './lib/actions/get-transaction';
import { getTransactionsAction } from './lib/actions/get-transactions';
import { createFulfillmentEventAction } from './lib/actions/create-fulfillment-event';
import { getFulfillmentsAction } from './lib/actions/get-fulfillments';
import { closeOrderAction } from './lib/actions/close-order';
import { cancelOrderAction } from './lib/actions/cancel-order';
import { getLocationsAction } from './lib/actions/get-locations';
import { adjustInventoryLevelAction } from './lib/actions/adjust-inventory-level';
import { getFulfillmentAction } from './lib/actions/get-fulfillment';
import { createCollectAction } from './lib/actions/create-collect';
import { updateOrderAction } from './lib/actions/update-order';
import { updateProductAction } from './lib/actions/update-product';
import { getAssetAction } from './lib/actions/get-asset';
import { getProductVariantAction } from './lib/actions/get-product-variant';
import { getProductAction } from './lib/actions/get-product';
import { uploadProductImageAction } from './lib/actions/upload-product-image';
import { newAbandonedCheckout } from './lib/triggers/new-abandoned-checkout';

const markdown = `
To Obtain an Admin Token, follow these steps:

1. Login to your Shopify account
2. Go to Settings -> Apps
3. Click on Develop apps
4. Create an App
5. Fill the app name
6. Click on Configure Admin API Scopes (Select the following scopes 'read_orders', 'write_orders', 'write_customers', 'read_customers', 'write_products', 'read_products', 'write_draft_orders', 'read_draft_orders')
7. Click on Install app
8. Copy the Admin Access Token

**Shop Name**
1- You can find your shop name in the url For example, if the URL is https://example.myshopify.com/admin, then your shop name is **example**.
`

export const shopifyAuth = PieceAuth.CustomAuth({
    description: markdown,
    required: true,
    props: {
        shopName: Property.ShortText({
            displayName: 'Shop Name',
            required: true
        }),
        adminToken: PieceAuth.SecretText({
            displayName: 'Admin Token',
            required: true
        })
    },
    validate: async ({ auth }) => {
        try {
            await sendShopifyRequest({
                auth,
                method: HttpMethod.GET,
                url: '/shop.json'
            })
            return {
                valid: true
            }
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid Shop Name or Admin Token'
            }
        }
    },
})

export const shopify = createPiece({
    displayName: 'Shopify',
    logoUrl: 'https://cdn.activepieces.com/pieces/shopify.png',
    authors: [
        "abuaboud",
        'MoShizzle'
    ],
    minimumSupportedRelease: '0.5.0',
    auth: shopifyAuth,
    actions: [
        adjustInventoryLevelAction,
        cancelOrderAction,
        closeOrderAction,
        createCollectAction,
        createCustomerAction,
        createDraftOrderAction,
        createFulfillmentEventAction,
        createOrderAction,
        createProductAction,
        createTransactionAction,
        getAssetAction,
        getCustomerAction,
        getCustomerOrdersAction,
        getFulfillmentAction,
        getFulfillmentsAction,
        getLocationsAction,
        getProductAction,
        getProductVariantAction,
        getProductsAction,
        getTransactionAction,
        getTransactionsAction,
        updateCustomerAction,
        updateOrderAction,
        updateProductAction,
        uploadProductImageAction
    ],
    triggers: [
        newAbandonedCheckout,
        newCancelledOrder,
        newCustomer,
        newOrder,
        updatedProduct,
        newPaidOrder,
    ],
});
