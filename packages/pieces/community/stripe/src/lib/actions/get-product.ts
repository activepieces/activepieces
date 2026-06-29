import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeGetProduct = createAction({
  name: 'get_product',
  auth: stripeAuth,
  displayName: 'Get Product (Agent)',
  description: 'Retrieve a Stripe product by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single Stripe product by its product ID (e.g., prod_...). Use List/Search Products to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description:
        'The product ID (e.g., prod_...). Obtain it from List/Search Products.',
      required: true,
    }),
  },
  async run(context) {
    const { product_id } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/products/${product_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});
