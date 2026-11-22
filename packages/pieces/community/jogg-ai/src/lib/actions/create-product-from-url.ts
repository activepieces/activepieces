import {
  HttpMethod,
  propsValidation,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini'
import { joggAiAuth } from '../..';
import { joggAiClient } from '../common/client';
import { joggAiOutputSchemas } from '../common/output-schemas';

export const createProductFromUrl = createAction({
  name: 'createProductFromUrl',
  classification: 'WRITE',
  displayName: 'Create Product from URL',
  description: 'Creates a product by crawling product information from a URL',
  audience: 'human',
  outputSchema: joggAiOutputSchemas.productEnvelope,
  aiMetadata: {
    description:
      'Creates a JoggAI product by crawling a single product page URL and extracting its details automatically. Use when you have only a product page link and want JoggAI to derive the product info for you; choose Create Product from Product Info instead when you already have the name, description, or media to supply directly. Not idempotent: each call creates a new product record.',
    idempotent: false,
  },
  auth: joggAiAuth,
  props: {
    url: Property.ShortText({
      displayName: 'Product URL',
      description: 'URL of the product to crawl and extract information from',
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const { url } = propsValue;

    await propsValidation.validateZod(propsValue, {
      url: z.string().check(z.url('Product URL must be a valid URL')),
    });

    return joggAiClient.requestEnvelope({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/product',
      op: 'create product',
      body: {
        url,
      },
    });
  },
});
