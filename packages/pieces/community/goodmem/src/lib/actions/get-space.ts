import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { goodmemAuth } from '../../index';
import { getBaseUrl, getCommonHeaders, extractAuthFromContext } from '../common';

export const getSpace = createAction({
  auth: goodmemAuth,
  name: 'get_space',
  displayName: 'Get Space',
  description: 'Fetch a specific space by its ID. Returns the full space details including name, labels, embedder configuration, chunking config, and access settings.',
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The UUID of the space to fetch (returned by Create Space)',
      required: true,
    }),
  },
  async run(context) {
    const { spaceId } = context.propsValue;
    const { baseUrl: rawBaseUrl, apiKey } = extractAuthFromContext(context.auth);
    const baseUrl = getBaseUrl(rawBaseUrl);

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v1/spaces/${spaceId}`,
        headers: getCommonHeaders(apiKey),
      });

      return {
        success: true,
        space: response.body,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get space',
        details: error.response?.body || error,
      };
    }
  },
});
