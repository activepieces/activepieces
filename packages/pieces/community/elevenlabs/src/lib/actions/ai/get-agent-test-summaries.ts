import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetAgentTestSummariesOutputSchema } from '../../output-schemas';

export const getAgentTestSummaries = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_agent_test_summaries',
  outputSchema: elevenlabsGetAgentTestSummariesOutputSchema,
  displayName: 'Get Agent Test Summaries',
  description: 'Get summaries of several agent tests',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns short summaries for a list of test ids. Read-only despite using POST.',
    idempotent: true,
  },
  props: {
    testIds: Property.Array({ displayName: 'Test Ids', description: 'Test ids from List Agent Tests', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/agent-testing/summaries`,
      body: elevenlabsClient.compact({ values: { test_ids: propsValue.testIds } }),
    });
    return response ?? { success: true };
  },
});
