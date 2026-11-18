import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateAgentTestOutputSchema } from '../../output-schemas';

export const createAgentTest = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_create_agent_test',
  outputSchema: elevenlabsCreateAgentTestOutputSchema,
  displayName: 'Create Agent Test',
  description: 'Create a response test for an agent',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a test that checks how an agent responds: an llm test judges the reply against a success condition, a tool test checks tool calls, a simulation test runs a full conversation. Returns the test id, which Run Agent Tests takes. Not idempotent: each call creates another test.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Test name', required: true }),
    type: Property.StaticDropdown({ displayName: 'Type', description: 'Defaults to llm', required: false, options: { options: [{ label: 'llm', value: 'llm' }, { label: 'tool', value: 'tool' }, { label: 'simulation', value: 'simulation' }] } }),
    successCondition: Property.LongText({ displayName: 'Success Condition', description: 'What a passing response must do', required: false }),
    chatHistory: Property.Json({ displayName: 'Chat History', description: 'Conversation so far, as a JSON array of transcript turns', required: false }),
    successExamples: Property.Json({ displayName: 'Success Examples', description: 'JSON array such as [{"response": "...", "type": "success"}]', required: false }),
    failureExamples: Property.Json({ displayName: 'Failure Examples', description: 'JSON array such as [{"response": "...", "type": "failure"}]', required: false }),
    dynamicVariables: Property.Json({ displayName: 'Dynamic Variables', description: 'Dynamic variables as a JSON object', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/agent-testing/create`,
      body: elevenlabsClient.compact({ values: { name: propsValue.name, type: propsValue.type, success_condition: propsValue.successCondition, chat_history: propsValue.chatHistory, success_examples: propsValue.successExamples, failure_examples: propsValue.failureExamples, dynamic_variables: propsValue.dynamicVariables } }),
    });
    return response ?? { success: true };
  },
});
