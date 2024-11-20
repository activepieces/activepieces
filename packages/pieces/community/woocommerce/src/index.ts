import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { wooCreateCoupon } from './lib/actions/create-coupon';
import { wooCreateCustomer } from './lib/actions/create-customer';
import { wooCreateProduct } from './lib/actions/create-product';
import { wooFindCustomer } from './lib/actions/find-customer';
import { wooFindProduct } from './lib/actions/find-product';
import { triggers } from './lib/triggers';

const authDescription = `
To generate your API credentials, follow the steps below:
1. Go to WooCommerce -> Settings -> Advanced tab -> REST API.
2. Click on Add Key to create a new key.
3. Enter the key description and change the permissions to Read/Write.
4. Click Generate Key.
5. Copy the Consumer Key and Consumer Secret into the fields below. You will not be able to view the Consumer Secret after exiting the page.

Note that the base URL of your WooCommerce instance needs to be on a secure (HTTPS) connection, or the piece will not work even on local instances on the same device.
`;

export const wooAuth = PieceAuth.CustomAuth({
  description: authDescription,
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description:
        'The base URL of your app (e.g https://mystore.com) and it should start with HTTPS only',
      required: true,
    }),
    consumerKey: Property.ShortText({
      displayName: 'Consumer Key',
      description: 'The consumer key generated from your app',
      required: true,
    }),
    consumerSecret: PieceAuth.SecretText({
      displayName: 'Consumer Secret',
      description: 'The consumer secret generated from your app',
      required: true,
    }),
  },
  async validate({ auth }) {
    const baseUrl = auth.baseUrl;
    if (!baseUrl.match(/^(https):\/\//)) {
      return {
        valid: false,
        error: 'Base URL must start with https (e.g https://mystore.com)',
      };
    }
    return { valid: true };
  },
});

export const woocommerce = createPiece({
  displayName: 'WooCommerce',
  description: 'E-commerce platform built on WordPress',

  logoUrl: 'https://cdn.activepieces.com/pieces/woocommerce.png',
  categories: [PieceCategory.COMMERCE],
  auth: wooAuth,
  minimumSupportedRelease: '0.30.0',
  authors: ["TaskMagicKyle","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  actions: [
    wooCreateCustomer,
    wooCreateCoupon,
    wooCreateProduct,
    wooFindCustomer,
    wooFindProduct,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { baseUrl: string }).baseUrl,
      auth: wooAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `${(auth as { consumerKey: string }).consumerKey}:${
            (auth as { consumerSecret: string }).consumerSecret
          }`
        ).toString('base64')}`,
      }),
    }),
  ],
  triggers: triggers,
});
