import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { chatlingAuth } from '../../index';
import { chatbotIdDropdown } from '../common/props';
import { makeRequest } from '../common';
import dayjs from 'dayjs';

type ConversationItem = {
  id: string;
  contact_id: string;
  archived: boolean;
  important: boolean;
  created_at: string;
  messages: { id: string; text: string; role: string }[];
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof chatlingAuth>,
  { chatbotId: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const response = await makeRequest<{
      data: {
        conversations: ConversationItem[];
      };
    }>(
      auth.secret_text,
      HttpMethod.GET,
      `/chatbots/${propsValue.chatbotId}/conversations?sort=date_desc`
    );

    const conversations = response.data.conversations;

    // Filter by lastFetchEpochMS if not first run
    const items = conversations
      .filter((conv) => {
        if (lastFetchEpochMS === 0) return true;
        return dayjs(conv.created_at).valueOf() > lastFetchEpochMS;
      })
      .map((conv) => ({
        epochMilliSeconds: dayjs(conv.created_at).valueOf(),
        data: conv,
      }));

    return items;
  },
};

export const newConversation = createTrigger({
  auth: chatlingAuth,
  name: 'new_conversation',
  displayName: 'New Conversation',
  description: 'Triggers when a new conversation is started by a customer.',
  props: {
    chatbotId: chatbotIdDropdown,
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: 'conv_abc123',
    contact_id: 'contact_xyz',
    archived: false,
    important: false,
    created_at: '2024-01-15T10:30:00.000Z',
    messages: [
      {
        id: 'msg_1',
        text: 'Hello, I need help with your product.',
        role: 'user',
      },
    ],
  },
});
