import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { goodmemAuth } from '../../index';
import { getBaseUrl, getCommonHeaders, extractAuthFromContext } from '../common';

export const listMemories = createAction({
  auth: goodmemAuth,
  name: 'list_memories',
  displayName: 'List Memories',
  description: 'List all memories in a space. Optionally filter by processing status (PENDING, PROCESSING, COMPLETED, FAILED) and include original content.',
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The UUID of the space to list memories from (returned by Create Space)',
      required: true,
    }),
    statusFilter: Property.StaticDropdown({
      displayName: 'Status Filter',
      description: 'Filter memories by their processing status',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Processing', value: 'PROCESSING' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Failed', value: 'FAILED' },
        ],
      },
    }),
    includeContent: Property.Checkbox({
      displayName: 'Include Content',
      description: 'Include the original document content in the response (may increase response size)',
      required: false,
      defaultValue: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort memories by',
      required: false,
      options: {
        options: [
          { label: 'Created At', value: 'created_at' },
          { label: 'Updated At', value: 'updated_at' },
        ],
      },
    }),
    sortOrder: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Sort direction',
      required: false,
      options: {
        options: [
          { label: 'Descending (newest first)', value: 'DESCENDING' },
          { label: 'Ascending (oldest first)', value: 'ASCENDING' },
        ],
      },
    }),
  },
  async run(context) {
    const { spaceId, statusFilter, includeContent, sortBy, sortOrder } = context.propsValue;
    const { baseUrl: rawBaseUrl, apiKey } = extractAuthFromContext(context.auth);
    const baseUrl = getBaseUrl(rawBaseUrl);

    const queryParams: string[] = [];
    if (includeContent) {
      queryParams.push('includeContent=true');
    }
    if (statusFilter) {
      queryParams.push(`statusFilter=${statusFilter}`);
    }
    if (sortBy) {
      queryParams.push(`sortBy=${sortBy}`);
    }
    if (sortOrder) {
      queryParams.push(`sortOrder=${sortOrder}`);
    }

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v1/spaces/${spaceId}/memories${queryString}`,
        headers: getCommonHeaders(apiKey),
      });

      const body = response.body;
      const memories = Array.isArray(body) ? body : (body?.memories || []);

      return {
        success: true,
        memories,
        totalMemories: memories.length,
        spaceId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list memories',
        details: error.response?.body || error,
      };
    }
  },
});
