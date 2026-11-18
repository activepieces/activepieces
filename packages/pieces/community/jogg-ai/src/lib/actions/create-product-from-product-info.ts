import {
  HttpMethod,
  propsValidation,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini'
import { joggAiAuth } from '../..';
import { joggAiClient } from '../common/client';
import { joggAiOutputSchemas } from '../common/output-schemas';

export const createProductFromProductInfo = createAction({
  name: 'createProductFromProductInfo',
  classification: 'WRITE',
  displayName: 'Create Product from Product Info',
  description: 'Creates a product from product information',
  audience: 'human',
  outputSchema: joggAiOutputSchemas.productEnvelope,
  aiMetadata: {
    description:
      'Creates a JoggAI product from supplied details (name, description, target audience, and media items) and/or a product URL. Use when you already hold the product info to pass directly; at least one of a URL or some product info must be provided, otherwise the call is rejected. Not idempotent: each call creates a new product record.',
    idempotent: false,
  },
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
      url: z.optional(z.string().check(z.url('URL must be a valid URL'))),
      name: z.optional(z.string().check(z.minLength(1, 'Product name cannot be empty'))),
      description: z.optional(z.string().check(z.minLength(1, 'Product description cannot be empty'))),
      target_audience: z.optional(z.string().check(z.minLength(1, 'Target audience cannot be empty'))),
      media: z.optional(z.array(z.object({
            type: z.number().check(z.minimum(1), z.maximum(2)),
            name: z.string().check(z.minLength(1, 'Media name is required')),
            url: z.string().check(z.url('Media URL must be a valid URL')),
            description: z.optional(z.string()),
          }))),
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
      requestBody.media = joggAiClient.records(media).map((item) => ({
        type: Number(item['type']),
        name: String(item['name'] ?? ''),
        url: String(item['url'] ?? ''),
        ...(typeof item['description'] === 'string' ? { description: item['description'] } : {}),
      }));
    }

    return joggAiClient.requestEnvelope({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/product',
      op: 'create product',
      body: requestBody,
    });
  },
});
