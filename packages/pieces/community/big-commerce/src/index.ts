import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { sendBigCommerceRequest } from './lib/common/auth';
import { abandonedCart } from './lib/triggers/abandoned-car';
import { cartCreated } from './lib/triggers/cart-created';
import { customerAddressCreated } from './lib/triggers/customer-address-created';
import { customerAddressUpdated } from './lib/triggers/customer-address-updated';
import { customerCreated } from './lib/triggers/customer-created';
import { customerUpdated } from './lib/triggers/customer-updated';
import { orderCreated } from './lib/triggers/order-created';
import { orderUpdated } from './lib/triggers/order-updated';
import { orderStatusUpdated } from './lib/triggers/order-status-updated';
import { productCreated } from './lib/triggers/product-created';
import { shipmentCreated } from './lib/triggers/shipment-created';
import { createCustomer } from './lib/actions/create-customer';
import { createCustomerAddress } from './lib/actions/create-customer-address';
import { createProduct } from './lib/actions/create-a-product';
import { createBlogPost } from './lib/actions/create-blog-post';
import { searchCustomer } from './lib/actions/search-customer';
import { findOrCreateCustomer } from './lib/actions/find-or-create-customer';
import { searchCustomerAddress } from './lib/actions/search-customer-address';
import { findOrCreateCustomerAddress } from "./lib/actions/find-or-create-customer's-address";
import { searchProduct } from './lib/actions/search-product';
import { findOrCreateProduct } from './lib/actions/find-or-create-product';

const markdown = `
**Store Hash**: Check your control panel URL: \`https://store-YOURSTOREHASH.mybigcommerce.com\`

**Access Token**:
1. Settings → API → API Accounts → Create API Account
2. Select V2/V3 API token
3. Set these to **Modify**: 
   - Orders
   - Products
   - Customers
   - Carts
   - Checkouts
   - Channel listings
   - Store Locations
   - Store Inventory
   - Order Fulfillment
   - **Content** (required for blog posts)
4. Set these to **Read-only**: 
   - Information & settings
   - Channel settings
   - Sites & routes
   - Store logs
   - Fulfillment Methods
5. Set Metafield Ownership to **Manage** and Metafields Access to **Full**
6. Click Save and copy your Access Token (shown only once!)

**Note**: If you get a 403 error when creating blog posts, ensure "Content" is set to **Modify** (not Read-only).
`;

export const bigCommerceAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    storeHash: Property.ShortText({
      displayName: 'Store Hash',
      description: 'Your BigCommerce store hash (e.g., abc123xyz)',
      required: true,
    }),
    accessToken: PieceAuth.SecretText({
      displayName: 'Access Token',
      description: 'Your BigCommerce API access token',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      // Test the connection by making a simple API call to get store information
      // Note: Using V2 API because V3 /store endpoint returns 404
      await sendBigCommerceRequest({
        auth: auth as { storeHash: string; accessToken: string },
        method: HttpMethod.GET,
        url: '/store',
        version: 'v2',
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Store Hash or Access Token. Please check your credentials.',
      };
    }
  },
});

export const bigCommerce = createPiece({
  displayName: 'BigCommerce',
  description: 'E-commerce platform for growing online stores',
  auth: bigCommerceAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/big-commerce.png',
  categories: [PieceCategory.COMMERCE],
  authors: [],
  actions: [
    createCustomer,
    createCustomerAddress,
    createProduct,
    createBlogPost,
    searchCustomer,
    findOrCreateCustomer,
    searchCustomerAddress,
    findOrCreateCustomerAddress,
    searchProduct,
    findOrCreateProduct,
  ],
  triggers: [
    abandonedCart,
    cartCreated,
    customerAddressCreated,
    customerAddressUpdated,
    customerCreated,
    customerUpdated,
    orderCreated,
    orderStatusUpdated,
    orderUpdated,
    productCreated,
    shipmentCreated,
  ],
});
