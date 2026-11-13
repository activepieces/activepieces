import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaSendMessage = createAction({
  auth: lettaAuth,
  name: 'letta_send_message',
  displayName: 'Send Message',
  description: 'Sends a message to an agent and waits for its reply.',
  classification: 'WRITE',
  audience: 'ai',
  outputSchema: lettaSchemas.sendMessage,
  aiMetadata: {
    description:
      'Sends a user message to a Letta agent and waits for the full (non-streaming) response. Returns assistant_text (the agent reply), every message the step produced (reasoning, tool calls, tool returns, assistant messages), the stop reason and token usage. Do not send to the same agent concurrently; Letta treats parallel requests to one agent as undefined behaviour. Not idempotent: each call adds to the agent\'s memory.',
    idempotent: false,
  },
  props: {
    agent_id: lettaProps.aiId({ displayName: 'Agent ID', description: 'The agent ID (agent-...). Get it from List Agents.' }),
    message: Property.LongText({ displayName: 'Message', description: 'The user message to send.', required: true }),
    max_steps: Property.Number({ displayName: 'Max Steps', description: 'Maximum reasoning steps the agent may take (Letta default applies when empty).', required: false }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const agentId = lettaApi.requireText({ value: propsValue.agent_id, name: 'Agent ID' });
    const message = lettaApi.requireText({ value: propsValue.message, name: 'Message' });
    const maxSteps = propsValue.max_steps === undefined || propsValue.max_steps === null ? undefined : lettaApi.resolveLimit({ limit: propsValue.max_steps, max: 1000, fallback: 1, label: 'Max Steps' });
    const response = await lettaApi.callLetta(() =>
      client.agents.messages.create(agentId, { streaming: false, input: message, max_steps: maxSteps })
    );
    return {
      assistant_text: lettaApi.assistantText(response.messages),
      messages: response.messages.map(lettaApi.mapMessage),
      stop_reason: response.stop_reason?.stop_reason ?? null,
      usage: response.usage ?? null,
    };
  },
});
