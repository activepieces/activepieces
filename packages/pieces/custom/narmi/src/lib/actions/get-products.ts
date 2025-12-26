import {
  createAction,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { narmiAuth } from '../..';

export const getProducts = createAction({
  name: 'get_products',
  auth: narmiAuth,
  displayName: 'Get Products',
  description: 'Get list of available Account Opening products',
  props: {},
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const apiKey = auth.apiKey;

    const headers: Record<string, string> = {
      'accept': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/v1/products/`,
      headers,
    });

    return response.body;
  },
});
