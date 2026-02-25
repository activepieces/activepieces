import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { goodmemAuth } from '../../index';
import { getBaseUrl, getCommonHeaders, extractAuthFromContext } from '../common';

export const listEmbedders = createAction({
  auth: goodmemAuth,
  name: 'list_embedders',
  displayName: 'List Embedders',
  description: 'List all available embedder models. Embedders convert text into vector representations used for similarity search. Use the returned embedder ID when creating a new space.',
  props: {},
  async run(context) {
    const { baseUrl: rawBaseUrl, apiKey } = extractAuthFromContext(context.auth);
    const baseUrl = getBaseUrl(rawBaseUrl);

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v1/embedders`,
        headers: getCommonHeaders(apiKey),
      });

      const body = response.body;
      const embedders = Array.isArray(body) ? body : (body?.embedders || []);

      return {
        success: true,
        embedders,
        totalEmbedders: embedders.length,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list embedders',
        details: error.response?.body || error,
      };
    }
  },
});
