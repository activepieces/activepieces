import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { goodmemAuth } from '../../index';
import { getBaseUrl, getCommonHeaders, extractAuthFromContext } from '../common';

export const listSpaces = createAction({
  auth: goodmemAuth,
  name: 'list_spaces',
  displayName: 'List Spaces',
  description: 'List all spaces in your GoodMem account. Returns each space with its ID, name, labels, embedder configuration, and access settings.',
  props: {},
  async run(context) {
    const { baseUrl: rawBaseUrl, apiKey } = extractAuthFromContext(context.auth);
    const baseUrl = getBaseUrl(rawBaseUrl);

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v1/spaces`,
        headers: getCommonHeaders(apiKey),
      });

      const body = response.body;
      const spaces = Array.isArray(body) ? body : (body?.spaces || []);

      return {
        success: true,
        spaces,
        totalSpaces: spaces.length,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list spaces',
        details: error.response?.body || error,
      };
    }
  },
});
