import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

export const createProduct = createAction({
  auth: stripeAuth,
  name: 'createProduct',
  displayName: 'Create Product',
  description: 'Create a new product in Stripe.',
  props: {
    name: Property.ShortText({
      displayName: 'Product Name',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      required: false,
      defaultValue: true,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      required: false,
      description: 'Key-value pairs to attach to the product.',
    }),
    images: Property.Array({
      displayName: 'Images',
      required: false,
      description: 'Array of image URLs.',
      properties: {
        item: Property.ShortText({
          displayName: 'Image URL',
          required: true,
        }),
      },
    }),
    url: Property.ShortText({
      displayName: 'Product URL',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { name, description, active, metadata, images, url } = propsValue;

    const body: Record<string, any> = {
      name,
      description,
      active,
      url,
    };

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        body[`metadata[${key}]`] = value;
      });
    }

    if (images && Array.isArray(images)) {
      images.forEach((img, idx) => {
        body[`images[${idx}]`] = img;
      });
    }

    Object.keys(body).forEach(
      (key) => body[key] === undefined && delete body[key]
    );

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.stripe.com/v1/products',
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});
