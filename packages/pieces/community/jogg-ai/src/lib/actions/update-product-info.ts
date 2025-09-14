import { httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { joggAiAuth } from '../..';

export const updateProductInfo = createAction({
  name: 'updateProductInfo',
  displayName: 'Update Product Info',
  description: 'Updates existing product information using product ID',
  auth: joggAiAuth,
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'Product ID obtained from product creation',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Updated product name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Product Description',
      description: 'Updated product description',
      required: false,
    }),
    target_audience: Property.ShortText({
      displayName: 'Target Audience',
      description: 'Updated target audience for the product',
      required: false,
    }),
    media: Property.Array({
      displayName: 'Media',
      description: 'Updated media resources for the product (replaces existing media)',
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Media Type',
          description: 'Type of media',
          required: true,
          options: {
            options: [
              { label: 'Image', value: 1 },
              { label: 'Video', value: 2 },
            ],
          },
        }),
        name: Property.ShortText({
          displayName: 'Media Name',
          description: 'Name/filename of the media',
          required: true,
        }),
        url: Property.ShortText({
          displayName: 'Media URL',
          description: 'URL of the media file',
          required: true,
        }),
        description: Property.LongText({
          displayName: 'Media Description',
          description: 'Description of the media',
          required: false,
        }),
      },
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { product_id, name, description, target_audience, media } = propsValue;

    // Zod validation
    await propsValidation.validateZod(propsValue, {
      product_id: z.string().min(1, 'Product ID is required'),
      name: z.string().optional(),
      description: z.string().optional(),
      target_audience: z.string().optional(),
      media: z.array(z.object({
        type: z.number().min(1).max(2),
        name: z.string().min(1, 'Media name is required'),
        url: z.string().url('Media URL must be a valid URL'),
        description: z.string().optional(),
      })).optional(),
    });

    const requestBody: any = {
      product_id,
    };

    // Add optional parameters if provided
    if (name) {
      requestBody.name = name;
    }
    if (description) {
      requestBody.description = description;
    }
    if (target_audience) {
      requestBody.target_audience = target_audience;
    }
    if (media) {
      requestBody.media = media;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: 'https://api.jogg.ai/v1/product',
      headers: {
        'x-api-key': auth,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    return response.body;
  },
});
