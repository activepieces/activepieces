import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListTestInvocationsOutputSchema } from '../../output-schemas';

export const listTestInvocations = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_test_invocations',
  outputSchema: elevenlabsListTestInvocationsOutputSchema,
  displayName: 'List Test Invocations',
  description: 'List agent test runs',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists past test runs, optionally for one agent. Page with next_cursor.',
    idempotent: true,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'Only runs for this agent', required: false }),
    pageSize: Property.Number({ displayName: 'Page Size', description: 'Between 1 and 100', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'next_cursor from a previous call', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> & { results: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/test-invocations`,
      queryParams: { agent_id: propsValue.agentId, page_size: propsValue.pageSize, cursor: propsValue.cursor },
    });
    return { ...response, count: response.results.length };
  },
});
