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
**Store Hash**:

Your store hash is the unique identifier for your BigCommerce store. You can find it in your store's API path.
For example, if your API URL is \`https://api.bigcommerce.com/stores/abc123xyz/v3\`, then your store hash is **abc123xyz**.

You can also find it in your BigCommerce control panel URL. If your control panel URL is \`https://store-abc123xyz.mybigcommerce.com\`, then your store hash is **abc123xyz**.

**Access Token**:

To get your access token:

1. Log in to your BigCommerce control panel
2. Go to **Settings** → **API Accounts** (under "Store-level API accounts")
3. Click **Create API Account**
4. Fill in the app name and select the OAuth scopes you need:
   - For full access, select "Modify" or "Read-only" for each resource as needed
   - Common scopes: Products, Orders, Customers, etc.
5. Click **Save**
6. Copy the **Access Token** (you can only see this once, so save it securely!)

**Note**: The Client ID and Client Secret are different from the Access Token. You only need the Access Token for API requests.
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
      await sendBigCommerceRequest({
        auth: auth as { storeHash: string; accessToken: string },
        method: HttpMethod.GET,
        url: '/store',
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
