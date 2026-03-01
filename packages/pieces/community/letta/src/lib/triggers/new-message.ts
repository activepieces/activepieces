import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
  PiecePropValueSchema,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { lettaAuth } from '../common/auth';
import { getLettaClient } from '../common/client';
import { agentIdDropdown } from '../common/props';
import type {
  Message,
  MessageListParams,
  ToolCallMessage,
} from '../common/types';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof lettaAuth>,
  { agentId: string } 
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { agentId } = propsValue;
    const client = getLettaClient(auth.props);

    const query: MessageListParams = {
      limit: 100,
    };

    const messagesPage = await client.agents.messages.list(agentId, query);

    const sendMessageToolCalls: ToolCallMessage[] = [];
    for await (const message of messagesPage) {
      if (message.message_type === 'tool_call_message') {
        const toolCallMessage = message as ToolCallMessage;
        
        let hasSendMessage = false;
        
        if (toolCallMessage.tool_calls) {
          if (Array.isArray(toolCallMessage.tool_calls)) {
            hasSendMessage = toolCallMessage.tool_calls.some(
              (tc) => tc.name === 'send_message'
            );
          } else {
            const delta = toolCallMessage.tool_calls;
            hasSendMessage = delta.name === 'send_message';
          }
        }
        
        if (!hasSendMessage && toolCallMessage.tool_call) {
          const toolCall = toolCallMessage.tool_call;
          if ('name' in toolCall && toolCall.name) {
            hasSendMessage = toolCall.name === 'send_message';
          }
        }
        
        if (hasSendMessage && toolCallMessage.date) {
          const messageDateEpoch = Date.parse(toolCallMessage.date);
          
          if (messageDateEpoch > lastFetchEpochMS) {
            sendMessageToolCalls.push(toolCallMessage);
          }
        }
      }
    }

    return sendMessageToolCalls
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
  displayName: 'New Message',
  description: 'Triggers when an agent uses send_message',
  type: TriggerStrategy.POLLING,
  props: {
    agentId: agentIdDropdown,
  },
  sampleData: {},
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

