import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { agentxAuth } from '../auth';
import { agentxApi } from '../common/api';
import { agentxProps } from '../common/props';
import type { AgentxAuthValue } from '../common/types';

const polling: Polling<AgentxAuthValue, { agentId?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const { agentId } = propsValue;

    if (!agentId) {
      return [];
    }

    const conversations = await agentxApi.listConversations({ auth, agentId });

    const sortedConversations = conversations.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());

    return sortedConversations.map((conv) => ({
      epochMilliSeconds: dayjs(conv.createdAt).valueOf(),
      data: conv,
    }));
  },
};

export const newConversationTrigger = createTrigger({
  auth: agentxAuth,
  name: 'new_conversation',
  classification: 'READ',
  displayName: 'New Conversation',
  description: 'Triggers when a new conversation begins with a specific Agent. Only detects conversations created after the trigger is enabled.',
  aiMetadata: {
    description: 'Fires when a new conversation begins with the configured AgentX agent (selected by agent ID), emitting the new conversation. Polls periodically and only detects conversations created after the trigger was enabled.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    agentId: agentxProps.agentId({ required: true }),
  },
  sampleData: {
    id: 'conv_1234567890abcdef',
    type: 'chat',
    created_at: '2025-09-08T11:45:00Z',
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
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
});
