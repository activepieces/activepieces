import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsRunAgentTestsOutputSchema } from '../../output-schemas';

export const runAgentTests = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_run_agent_tests',
  outputSchema: elevenlabsRunAgentTestsOutputSchema,
  displayName: 'Run Agent Tests',
  description: 'Run tests against an agent',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Starts a run of the given tests against an agent and returns a test invocation. Poll Get Test Invocation until the runs finish. Not idempotent: each call starts a new run.',
    idempotent: false,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'The agent_id from List Agents', required: true }),
    tests: Property.Json({ displayName: 'Tests', description: 'JSON array of tests to run, such as [{"test_id": "..."}]', required: true }),
    repeatCount: Property.Number({ displayName: 'Repeat Count', description: 'Times to run each test', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/agents/${encodeURIComponent(propsValue.agentId)}/run-tests`,
      body: elevenlabsClient.compact({ values: { tests: propsValue.tests, repeat_count: propsValue.repeatCount } }),
    });
    return response ?? { success: true };
  },
});
