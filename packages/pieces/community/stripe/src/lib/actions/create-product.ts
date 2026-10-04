import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { productOutputSchema } from '../output-schemas';
export const stripeCreateProduct = createAction({
  name: 'create_product',
  classification: 'WRITE',
  auth: stripeAuth,
  displayName: 'Create Product',
  description: 'Create a product you can add prices to.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new product object in Stripe (the catalog item that prices attach to), with optional description, images, URL, and metadata. Use before creating a price or when adding a sellable item. Not idempotent: each call creates a distinct product.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Shown to customers at checkout and on invoices.',
      required: true,
      placeholder: 'Premium Plan',
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Shown to customers under the product name.',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'Turn off to hide the product from new purchases.',
      required: false,
      defaultValue: true,
    }),
    images: Property.Array({
      displayName: 'Image URLs',
      description: 'Up to 8 public image links.',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'Product URL',
      description: 'A public page about this product.',
      required: false,
      advanced: true,
      placeholder: 'https://example.com/premium',
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Extra key/value data to store on the product.',
      required: false,
      advanced: true,
    }),
  },
  outputSchema: productOutputSchema,
  async run(context) {
    const { name, description, active, images, url, metadata } =
      context.propsValue;

    const body: { [key: string]: unknown } = {
      name: name,
    };

    if (description) body.description = description;
    if (active !== undefined) body.active = active;
    if (url) body.url = url;

    if (images && Array.isArray(images)) {
      images.forEach((image, index) => {
        body[`images[${index}]`] = image;
      });
    }
    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach((key) => {
        body[`metadata[${key}]`] = (metadata as Record<string, string>)[key];
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/products`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    return response.body;
  },
});
