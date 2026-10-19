import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListAgentsOutputSchema } from '../../output-schemas';

export const listAgents = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_agents',
  outputSchema: elevenlabsListAgentsOutputSchema,
  displayName: 'List Agents',
  description: 'List conversational AI agents',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists agents with their ids and names. Search by name and page with next_cursor. Use to find an agent_id.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Text matched against the agent name', required: false }),
    pageSize: Property.Number({ displayName: 'Page Size', description: 'Between 1 and 100', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'next_cursor from a previous call', required: false }),
    archived: Property.StaticDropdown({ displayName: 'Archived', description: 'Only archived agents', required: false, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
    sortDirection: Property.StaticDropdown({ displayName: 'Sort Direction', required: false, options: { options: [{ label: 'asc', value: 'asc' }, { label: 'desc', value: 'desc' }] } }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> & { agents: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/agents`,
      queryParams: { search: propsValue.search, page_size: propsValue.pageSize, cursor: propsValue.cursor, archived: propsValue.archived, sort_direction: propsValue.sortDirection },
    });
    return { ...response, count: response.agents.length };
  },
});
