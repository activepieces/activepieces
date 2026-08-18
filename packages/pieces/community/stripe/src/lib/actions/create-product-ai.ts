import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { productOutputSchema } from '../output-schemas';
export const stripeCreateProductAi = createAction({
  name: 'create_product_ai',
  auth: stripeAuth,
  displayName: 'Create Product (Agent)',
  description: 'Create a new product object in Stripe.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Stripe product (the catalog item that prices attach to), with optional description, images, URL, and metadata. Use before creating a price or when adding a sellable item; to archive a product use Update Product with active=false. Not idempotent: each call creates a distinct product.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'The product name, displayable to the customer.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The product description, displayable to the customer.',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description:
        'Whether the product is currently available for purchase. Defaults to true.',
      required: false,
    }),
    images: Property.Array({
      displayName: 'Image URLs',
      description: 'A list of up to 8 URLs of images for this product.',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'Product URL',
      description: 'A publicly-accessible online page for this product.',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description:
        'A set of key-value pairs to store additional information about the product.',
      required: false,
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
