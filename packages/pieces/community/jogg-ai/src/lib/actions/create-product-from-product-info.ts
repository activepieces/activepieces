import { httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { joggAiAuth } from '../..';

export const createProductFromProductInfo = createAction({
  name: 'createProductFromProductInfo',
  displayName: 'Create Product from Product Info',
  description: 'Creates a product from product info',
  auth: joggAiAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Name of the product',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Product Description',
      description: 'Detailed description of the product',
      required: true,
    }),
    target_audience: Property.ShortText({
      displayName: 'Target Audience',
      description: 'Target audience for the product',
      required: false,
    }),
    media: Property.Array({
      displayName: 'Media',
      description: 'Media resources for the product (must provide at least 3)',
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
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const { name, description, target_audience, media } = propsValue;

    // Zod validation
    await propsValidation.validateZod(propsValue, {
      name: z.string().min(1, 'Product name is required'),
      description: z.string().min(1, 'Product description is required'),
      target_audience: z.string().optional(),
      media: z.array(z.object({
        type: z.number().min(1).max(2),
        name: z.string().min(1, 'Media name is required'),
        url: z.string().url('Media URL must be a valid URL'),
        description: z.string().optional(),
      })).min(3, 'At least 3 media items are required'),
    });

    const requestBody: any = {
      name,
      description,
      media,
    };

    // Add optional target_audience if provided
    if (target_audience) {
      requestBody.target_audience = target_audience;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
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
