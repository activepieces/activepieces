import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { goodmemAuth } from '../../index';
import { getBaseUrl, getCommonHeaders, extractAuthFromContext } from '../common';

export const deleteSpace = createAction({
  auth: goodmemAuth,
  name: 'delete_space',
  displayName: 'Delete Space',
  description: 'Permanently delete a space and all its associated memories, chunks, and vector embeddings',
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The UUID of the space to delete (returned by Create Space)',
      required: true,
    }),
  },
  async run(context) {
    const { spaceId } = context.propsValue;
    const { baseUrl: rawBaseUrl, apiKey } = extractAuthFromContext(context.auth);
    const baseUrl = getBaseUrl(rawBaseUrl);

    try {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${baseUrl}/v1/spaces/${spaceId}`,
        headers: getCommonHeaders(apiKey),
      });

      return {
        success: true,
        spaceId,
        message: 'Space deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete space',
        details: error.response?.body || error,
      };
    }
  },
});
