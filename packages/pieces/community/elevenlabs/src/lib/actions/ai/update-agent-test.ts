import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetAgentTestOutputSchema } from '../../output-schemas';

export const updateAgentTest = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_update_agent_test',
  outputSchema: elevenlabsGetAgentTestOutputSchema,
  displayName: 'Update Agent Test',
  description: 'Change an agent test',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Updates an agent test. The API replaces the whole test, so the action reads the current test and re-sends it with only the supplied fields changed. Re-applying the same values is safe.',
    idempotent: true,
  },
  props: {
    testId: Property.ShortText({ displayName: 'Test ID', description: 'The test id from Create Agent Test or List Agent Tests', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    successCondition: Property.LongText({ displayName: 'Success Condition', description: 'What a passing response must do', required: false }),
    successExamples: Property.Json({ displayName: 'Success Examples', description: 'Replaces the examples, JSON array such as [{"response": "...", "type": "success"}]', required: false }),
    failureExamples: Property.Json({ displayName: 'Failure Examples', description: 'Replaces the examples, JSON array such as [{"response": "...", "type": "failure"}]', required: false }),
  },
  async run({ auth, propsValue }) {
    const path = `/v1/convai/agent-testing/${encodeURIComponent(propsValue.testId)}`;
    const { id: _id, ...current } = await elevenlabsClient.request<Record<string, unknown>>({ auth, method: HttpMethod.GET, path });
    return elevenlabsClient.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.PUT,
      path,
      body: {
        ...current,
        ...elevenlabsClient.compact({
          values: {
            name: propsValue.name,
            success_condition: propsValue.successCondition,
            success_examples: propsValue.successExamples,
            failure_examples: propsValue.failureExamples,
          },
        }),
      },
    });
  },
});
