import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { lettaAuth } from '../common/auth';
import { lettaApi } from '../common/client';
import { lettaSchemas } from '../common/schemas';
import { watchedAgentDropdown } from '../common/props';
import { lettaPolling } from '../common/polling';
import type {
  Message,
  MessageListParams,
} from '../common/types';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof lettaAuth>,
  { agentId: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { agentId } = propsValue;
    const client = await lettaApi.getLettaClient({ auth: auth.props });

    const messages = await lettaPolling.collectSince<Message>({
      lastFetchEpochMS,
      timestampOf: (message) => Date.parse(message.date),
      fetchPage: async (page) => {
        const query: MessageListParams = { ...page, order: 'desc' };
        const messagesPage = await lettaApi.callLetta(() => client.agents.messages.list(agentId, query));
        return messagesPage.getPaginatedItems();
      },
    });

    const replies: Message[] = messages.filter(isAgentReply);

    return replies
      .sort((a, b) => {
        const aTime = a.date ? Date.parse(a.date) : 0;
        const bTime = b.date ? Date.parse(b.date) : 0;
        return bTime - aTime;
      })
      .map((message) => ({
        epochMilliSeconds: message.date ? Date.parse(message.date) : Date.now(),
        data: message,
      }));
  },
};

export const newMessage = createTrigger({
  auth: lettaAuth,
  name: 'newMessage',
  classification: 'READ',
  displayName: 'New Message',
  description: 'Triggers when an agent replies (assistant message, or send_message on legacy agents)',
  aiMetadata: {
    description: 'Fires when a specific Letta agent (by agent ID) replies to the user: an assistant_message from current agents, or a send_message tool call from legacy memgpt agents. Polls messages newest first, paging back to the last poll (up to 1000 messages), and emits replies newer than the last poll.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    agentId: watchedAgentDropdown,
  },
  outputSchema: lettaSchemas.newMessageTrigger,
  sampleData: {
    id: 'message-3c9e1f2a-7b4d-4e8a-a1c5-9d0f6b2e8a71',
    date: '2026-10-29T10:20:00.000Z',
    otid: '7f69faf4-7a40-4330-85ab-51fb4af79201',
    run_id: 'run-5a2b8c1d-4e6f-4a9b-8c7d-1e2f3a4b5c6d',
    step_id: 'step-8d7c6b5a-4f3e-4d2c-9b1a-0f9e8d7c6b5a',
    name: null,
    sender_id: null,
    seq_id: 170544687,
    is_err: null,
    message_type: 'assistant_message',
    content: 'Hi! How can I help you today?',
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
});


function isAgentReply(message: Message): boolean {
  if (message.message_type === 'assistant_message') {
    return true;
  }
  if (message.message_type !== 'tool_call_message' || !('tool_call' in message)) {
    return false;
  }
  const calls = Array.isArray(message.tool_calls)
    ? message.tool_calls
    : message.tool_calls
      ? [message.tool_calls]
      : [];
  return message.tool_call.name === 'send_message' || calls.some((call) => call.name === 'send_message');
}
