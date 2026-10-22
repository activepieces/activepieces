import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { productOutputSchema } from '../output-schemas';
export const stripeUpdateProduct = createAction({
  name: 'update_product',
  classification: 'WRITE',
  auth: stripeAuth,
  displayName: 'Update Product (Agent)',
  description: 'Update or archive a Stripe product.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a Stripe product (rename, change description/metadata, or set active=no to archive it). Archiving is the agent path to "delete" a product, since products with prices cannot be hard-deleted. active takes yes, no or unchanged; leave it out or pass unchanged to keep the product active or archived as it is. Only the fields you supply change. Idempotent: re-applying the same update converges.',
    idempotent: true,
  },
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description:
        'The product ID (e.g., prod_...). Obtain it from List/Search Products.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    active: stripeCommon.triStateProp({
      displayName: 'Active',
      description: 'No archives the product, Yes makes it available again.',
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      required: false,
    }),
  },
  outputSchema: productOutputSchema,
  async run(context) {
    const { product_id, name, description, metadata } = context.propsValue;
    const active = stripeCommon.triStateValue(context.propsValue.active);

    const body: { [key: string]: unknown } = {};
    if (name) body.name = name;
    if (description) body.description = description;
    if (active !== undefined) body.active = active;
    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach((key) => {
        body[`metadata[${key}]`] = (metadata as Record<string, string>)[key];
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/products/${product_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});
