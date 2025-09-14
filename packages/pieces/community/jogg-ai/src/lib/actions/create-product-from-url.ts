import { httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
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

    // Zod validation
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
        url
      },
    });

    return response.body;
  },
});
