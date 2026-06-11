import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { goodmemAuth } from '../../index';
import { getBaseUrl, getCommonHeaders, extractAuthFromContext } from '../common';

export const deleteMemory = createAction({
  auth: goodmemAuth,
  name: 'delete_memory',
  displayName: 'Delete Memory',
  description: 'Permanently delete a memory and its associated chunks and vector embeddings.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a GoodMem memory and its associated chunks and vector embeddings, identified by memory ID. Use it to remove stored content from a space. This is destructive but idempotent: once the memory is gone, repeating the call with the same ID leaves the end state unchanged.', idempotent: true },
  props: {
    memoryId: Property.ShortText({
      displayName: 'Memory ID',
      description: 'The UUID of the memory to delete (returned by Create Memory)',
      required: true,
    }),
  },
  async run(context) {
    const { memoryId } = context.propsValue;
    const { baseUrl: rawBaseUrl, apiKey } = extractAuthFromContext(context.auth);
    const baseUrl = getBaseUrl(rawBaseUrl);

    try {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${baseUrl}/v1/memories/${memoryId}`,
        headers: getCommonHeaders(apiKey),
      });

      return {
        success: true,
        memoryId,
        message: 'Memory deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete memory',
        details: error.response?.body || error,
      };
    }
  },
});
