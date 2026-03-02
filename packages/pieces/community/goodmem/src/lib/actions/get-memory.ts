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
      // Get memory metadata
      const metadataResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v1/memories/${memoryId}`,
        headers: getCommonHeaders(apiKey),
      });

      const result: any = {
        success: true,
        memory: metadataResponse.body,
      };

      // If content requested, fetch it separately
      if (includeContent) {
        try {
          const contentResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${baseUrl}/v1/memories/${memoryId}/content`,
            headers: getCommonHeaders(apiKey),
          });
          result.content = contentResponse.body;
        } catch (contentError: any) {
          result.contentError = 'Failed to fetch content: ' + (contentError.message || 'Unknown error');
        }
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get memory',
        details: error.response?.body || error,
      };
    }
  },
});
