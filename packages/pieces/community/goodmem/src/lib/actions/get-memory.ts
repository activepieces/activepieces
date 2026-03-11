import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { goodmemAuth } from '../../index';
import { getBaseUrl, getCommonHeaders, extractAuthFromContext } from '../common';

export const getMemory = createAction({
  auth: goodmemAuth,
  name: 'get_memory',
  displayName: 'Get Memory',
  description: 'Fetch a specific memory record by its ID, including metadata, processing status, and optionally the original content.',
  props: {
    memoryId: Property.ShortText({
      displayName: 'Memory ID',
      description: 'The UUID of the memory to fetch (returned by Create Memory)',
      required: true,
    }),
    includeContent: Property.Checkbox({
      displayName: 'Include Content',
      description: 'Fetch the original document content of the memory in addition to its metadata',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { memoryId, includeContent } = context.propsValue;
    const { baseUrl: rawBaseUrl, apiKey } = extractAuthFromContext(context.auth);
    const baseUrl = getBaseUrl(rawBaseUrl);

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v1/memories/${memoryId}?includeContent=${includeContent ?? false}`,
        headers: getCommonHeaders(apiKey),
      });

      return {
        success: true,
        memory: response.body,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get memory',
        details: error.response?.body || error,
      };
    }
  },
});
