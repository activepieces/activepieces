import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsDeleteKbDocumentOutputSchema } from '../../output-schemas';

export const resubmitTestInvocation = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_resubmit_test_invocation',
  outputSchema: elevenlabsDeleteKbDocumentOutputSchema,
  displayName: 'Resubmit Test Invocation',
  description: 'Re-run tests of a previous run',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Re-runs selected test runs of a previous invocation against the agent. Not idempotent: each call starts new runs.',
    idempotent: false,
  },
  props: {
    testInvocationId: Property.ShortText({ displayName: 'Test Invocation ID', description: 'The id from List Test Invocations', required: true }),
    testRunIds: Property.Array({ displayName: 'Test Run Ids', description: 'test_run ids from Get Test Invocation', required: true }),
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'The agent to run against', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/test-invocations/${encodeURIComponent(propsValue.testInvocationId)}/resubmit`,
      body: elevenlabsClient.compact({ values: { test_run_ids: propsValue.testRunIds, agent_id: propsValue.agentId } }),
    });
    return response ?? { success: true };
  },
});
