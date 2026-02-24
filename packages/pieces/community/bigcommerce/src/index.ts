import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { abandonedCart } from './lib/triggers/abandoned-cart';
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
import { bigcommerceAuth } from './lib/common/auth';
import { createAProduct } from './lib/actions/create-a-product';
import { createBlogPost } from './lib/actions/create-blog-post';
import { createCustomerAddress } from './lib/actions/create-customer-address';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { bigCommerceAuth, GET_BASE_URL } from './lib/common/constants';
import { searchCustomer } from './lib/actions/search-customer';
import { searchProduct } from './lib/actions/search-product';
import { searchCustomerAddress } from './lib/actions/search-customer-address';
import { findOrCreateCustomer } from './lib/actions/find-or-create-customer';
import { findOrCreateProduct } from './lib/actions/find-or-create-product';
import { findOrCreateCustomersAddress } from './lib/actions/find-or-create-customers-address';

export const bigcommerce = createPiece({
  displayName: 'Bigcommerce',
  description:
    'BigCommerce is a leading e-commerce platform that enables businesses to create and manage online stores.',
  auth: bigcommerceAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bigcommerce.png',
  authors: ['gs03-dev', 'sanket-a11y'],
  actions: [
    createCustomer,
    createAProduct,
    createBlogPost,
    createCustomerAddress,
    searchCustomer,
    searchProduct,
    searchCustomerAddress,
    findOrCreateCustomer,
    findOrCreateProduct,
    findOrCreateCustomersAddress,
    createCustomApiCallAction({
      auth: bigcommerceAuth,
      baseUrl: (auth) => auth ? GET_BASE_URL(auth.props.storeHash) : '',
      authMapping: async (auth: any) => {
        return {
          'X-Auth-Token': auth.props.accessToken,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };
      },
    }),
  ],
  triggers: [
    abandonedCart,
    cartCreated,
    customerAddressCreated,
    customerAddressUpdated,
    customerCreated,
    customerUpdated,
    orderCreated,
    orderUpdated,
    orderStatusUpdated,
    productCreated,
    shipmentCreated,
  ],
});
