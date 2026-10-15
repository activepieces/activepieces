import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsSimulateAgentConversationOutputSchema } from '../../output-schemas';

export const simulateAgentConversation = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_simulate_agent_conversation',
  outputSchema: elevenlabsSimulateAgentConversationOutputSchema,
  displayName: 'Simulate Agent Conversation',
  description: 'Simulate a conversation with an agent',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Runs a simulated conversation between the agent and a simulated user described by simulation_specification, and returns the transcript and analysis. Use to test an agent without a live call. Not idempotent: each run differs and consumes credits.',
    idempotent: false,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'The agent_id from List Agents or Create Agent', required: true }),
    simulationSpecification: Property.Json({ displayName: 'Simulation Specification', description: 'Simulated user, such as {"simulated_user_config": {"prompt": {"prompt": "You are a customer asking about pricing"}}}', required: true }),
    newTurnsLimit: Property.Number({ displayName: 'New Turns Limit', description: 'Maximum turns to simulate', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/agents/${encodeURIComponent(propsValue.agentId)}/simulate-conversation`,
      body: elevenlabsClient.compact({ values: { simulation_specification: propsValue.simulationSpecification, new_turns_limit: propsValue.newTurnsLimit } }),
    });
    return response ?? { success: true };
  },
});
