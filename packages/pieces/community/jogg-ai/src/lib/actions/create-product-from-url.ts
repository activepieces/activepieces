import {
  httpClient,
  HttpMethod,
  propsValidation,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { joggAiAuth } from '../..';

export const createProductFromUrl = createAction({
  name: 'createProductFromUrl',
  displayName: 'Create Product from URL',
  description: 'Creates a product by crawling product information from a URL',
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
      url: z.string().url('Product URL must be a valid URL'),
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.jogg.ai/v1/product',
      headers: {
        'x-api-key': auth,
        'Content-Type': 'application/json',
      },
      body: {
        url,
      },
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
