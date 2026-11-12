import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../common/auth';
import { lettaApi } from '../common/client';
import { lettaSchemas } from '../common/schemas';
import { agentIdDropdown } from '../common/props';
import type {
  MessageCreateParamsNonStreaming,
  LettaResponse,
} from '../common/types';

export const sendMessageToAgent = createAction({
  auth: lettaAuth,
  name: 'sendMessageToAgent',
  classification: 'WRITE',
  displayName: 'Send Message to Agent',
  description: 'Send message to an agent',
  audience: 'human',
  outputSchema: lettaSchemas.humanSendMessage,
  props: {
    agentId: agentIdDropdown,
    input: Property.LongText({
      displayName: 'Message',
      description: 'The message content to send to the agent',
      required: true,
    }),
    maxSteps: Property.Number({
      displayName: 'Max Steps',
      description: 'Maximum number of steps the agent should take to process the request',
      required: false,
    }),
  },
  async run(context) {
    const {
      agentId,
      input,
      maxSteps,
    } = context.propsValue;

    const client = await lettaApi.getLettaClient({ auth: context.auth.props });

    const body: MessageCreateParamsNonStreaming = {
      streaming: false,
      input: input,
    };

    if (maxSteps !== undefined && maxSteps !== null) {
      body.max_steps = maxSteps;
    }

    const response: LettaResponse = await lettaApi.callLetta(() =>
      client.agents.messages.create(agentId, body)
    );

    return {
      messages: response.messages,
      stopReason: response.stop_reason,
      usage: response.usage,
      success: true,
    };
  },
});

