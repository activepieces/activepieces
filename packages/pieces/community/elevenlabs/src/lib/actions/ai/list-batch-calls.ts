import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListBatchCallsOutputSchema } from '../../output-schemas';

export const listBatchCalls = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_batch_calls',
  outputSchema: elevenlabsListBatchCallsOutputSchema,
  displayName: 'List Batch Calls',
  description: 'List batch calls',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists batch calls in the workspace with status and progress counts. Page with next_doc.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({ displayName: 'Limit', description: 'Between 1 and 100', required: false }),
    lastDoc: Property.ShortText({ displayName: 'Last Doc', description: 'next_doc from a previous call', required: false }),
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'Only this agent', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> & { batch_calls: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/batch-calling/workspace`,
      queryParams: { limit: propsValue.limit, last_doc: propsValue.lastDoc, agent_id: propsValue.agentId },
    });
    return { ...response, count: response.batch_calls.length };
  },
});
