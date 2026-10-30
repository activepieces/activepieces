import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListToolsOutputSchema } from '../../output-schemas';

export const listTools = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_tools',
  outputSchema: elevenlabsListToolsOutputSchema,
  displayName: 'List Tools',
  description: 'List agent tools',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists workspace agent tools with their ids and configuration. Search by name and page with next_cursor.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Text matched against the tool name', required: false }),
    pageSize: Property.Number({ displayName: 'Page Size', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'next_cursor from a previous call', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> & { tools: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/tools`,
      queryParams: { search: propsValue.search, page_size: propsValue.pageSize, cursor: propsValue.cursor },
    });
    return { ...response, count: response.tools.length };
  },
});
