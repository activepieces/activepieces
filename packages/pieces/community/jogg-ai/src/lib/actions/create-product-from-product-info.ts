import {
  httpClient,
  HttpMethod,
  propsValidation,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { joggAiAuth } from '../..';

export const createProductFromProductInfo = createAction({
  name: 'createProductFromProductInfo',
  displayName: 'Create Product from Product Info',
  description: 'Creates a product from product information',
  auth: joggAiAuth,
  props: {
    url: Property.ShortText({
      displayName: 'Product URL',
      description: 'URL of the product to crawl for information',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Name of the product',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Product Description',
      description: 'Product introduction and selling points',
      required: false,
    }),
    target_audience: Property.ShortText({
      displayName: 'Target Audience',
      description: 'Target audience for the product',
      required: false,
    }),
    media: Property.Array({
      displayName: 'Media',
      description: 'Media resources for the product',
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
    const { url, name, description, target_audience, media } = propsValue;

    const hasUrl = !!url;
    const hasProductInfo = !!(
      name ||
      description ||
      target_audience ||
      media?.length
    );

    if (!hasUrl && !hasProductInfo) {
      throw new Error(
        'You must provide either a URL or product information (name, description, etc.)'
      );
    }

    await propsValidation.validateZod(propsValue, {
      url: z.string().url('URL must be a valid URL').optional(),
      name: z.string().min(1, 'Product name cannot be empty').optional(),
      description: z
        .string()
        .min(1, 'Product description cannot be empty')
        .optional(),
      target_audience: z
        .string()
        .min(1, 'Target audience cannot be empty')
        .optional(),
      media: z
        .array(
          z.object({
            type: z.number().min(1).max(2),
            name: z.string().min(1, 'Media name is required'),
            url: z.string().url('Media URL must be a valid URL'),
            description: z.string().optional(),
          })
        )
        .optional(),
    });

    const requestBody: {
      url?: string;
      name?: string;
      description?: string;
      target_audience?: string;
      media?: Array<{
        type: number;
        name: string;
        url: string;
        description?: string;
      }>;
    } = {};

    if (url) {
      requestBody.url = url;
    }
    if (name) {
      requestBody.name = name;
    }
    if (description) {
      requestBody.description = description;
    }
    if (target_audience) {
      requestBody.target_audience = target_audience;
    }
    if (media && media.length > 0) {
      requestBody.media = media as Array<{
        type: number;
        name: string;
        url: string;
        description?: string;
      }>;
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

    if (response.body.code !== 0) {
      const errorMessages: Record<number, string> = {
        10104: 'Record not found',
        10105: 'Invalid API key',
        18020: 'Insufficient credit',
        18025: 'No permission to call APIs',
        40000: 'Parameter error',
        50000: 'System error',
      };

      const message =
        errorMessages[response.body.code] || `API Error: ${response.body.msg}`;
      throw new Error(message);
    }

    return response.body;
  },
});
