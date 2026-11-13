import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListKbDependentAgentsOutputSchema } from '../../output-schemas';

export const listKbDependentAgents = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_kb_dependent_agents',
  outputSchema: elevenlabsListKbDependentAgentsOutputSchema,
  displayName: 'List KB Dependent Agents',
  description: 'List agents using a document',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the agents that use a knowledge base document. Check this before deleting a document.',
    idempotent: true,
  },
  props: {
    documentationId: Property.ShortText({ displayName: 'Documentation ID', description: 'The document id from List KB Documents or a create action', required: true }),
    dependentType: Property.StaticDropdown({ displayName: 'Dependent Type', required: false, options: { options: [{ label: 'direct', value: 'direct' }, { label: 'transitive', value: 'transitive' }, { label: 'all', value: 'all' }] } }),
    pageSize: Property.Number({ displayName: 'Page Size', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> & { agents: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/knowledge-base/${encodeURIComponent(propsValue.documentationId)}/dependent-agents`,
      queryParams: { dependent_type: propsValue.dependentType, page_size: propsValue.pageSize, cursor: propsValue.cursor },
    });
    return { ...response, count: response.agents.length };
  },
});
