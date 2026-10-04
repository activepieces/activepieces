import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetAgentTestOutputSchema } from '../../output-schemas';

export const getAgentTest = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_agent_test',
  outputSchema: elevenlabsGetAgentTestOutputSchema,
  displayName: 'Get Agent Test',
  description: 'Get an agent test',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one agent test with its type, success condition and examples.',
    idempotent: true,
  },
  props: {
    testId: Property.ShortText({ displayName: 'Test ID', description: 'The test id from Create Agent Test or List Agent Tests', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/agent-testing/${encodeURIComponent(propsValue.testId)}`,
    });
    return response ?? { success: true };
  },
});
