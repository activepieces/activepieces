import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListKbDependentAgentsOutputSchema } from '../../output-schemas';

export const listToolDependentAgents = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_tool_dependent_agents',
  outputSchema: elevenlabsListKbDependentAgentsOutputSchema,
  displayName: 'List Tool Dependent Agents',
  description: 'List agents using a tool',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the agents that use a tool. Check this before deleting a tool.',
    idempotent: true,
  },
  props: {
    toolId: Property.ShortText({ displayName: 'Tool ID', description: 'The tool id from List Tools or Create Tool', required: true }),
    cursor: Property.ShortText({ displayName: 'Cursor', required: false }),
    pageSize: Property.Number({ displayName: 'Page Size', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> & { agents: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/tools/${encodeURIComponent(propsValue.toolId)}/dependent-agents`,
      queryParams: { cursor: propsValue.cursor, page_size: propsValue.pageSize },
    });
    return { ...response, count: response.agents.length };
  },
});
