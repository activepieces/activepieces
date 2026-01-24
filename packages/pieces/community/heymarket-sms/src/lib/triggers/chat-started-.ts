import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { heymarketSmsAuth } from '../common/auth';
import { makeRequest } from '../common/client';

interface ConversationMember {
  id: number;
  name: string;
}

interface HeymarketConversation {
  id: number;
  inbox: number;
  name: string;
  status: string;
  channel: string;
  created: string;
  updated: string;
  assigned: number;
  creator: number;
  members: ConversationMember[];
  read: number;
  replied: boolean;
  blocked: boolean;
  muted: boolean;
  support: boolean;
  type: string;
  target: string;
  noreply: string;
  snooze_till: string;
  last_inbound: number;
  email_noti: boolean;
  local_id: string;
  super: number;
  op: string;
}

interface ConversationFilters {
  inboxes: number[];
  closed?: boolean;
  unread?: boolean;
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof heymarketSmsAuth>,
  { userId?: number; inboxId?: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, auth, lastFetchEpochMS }) => {
    try {
      const apiKey = auth.secret_text;
      const { userId, inboxId } = propsValue;

      if (!userId || !inboxId) {
        console.warn('Conversation trigger: userId or inboxId not provided');
        return [];
      }

      // Convert lastFetchEpochMS to RFC 3339 format for Heymarket API
      const lastFetchDate = lastFetchEpochMS
        ? dayjs(lastFetchEpochMS).toISOString()
        : undefined;

      // Prepare filters for conversation query
      const filters: ConversationFilters = {
        inboxes: [Number(inboxId)],
        closed: false,
      };

      // Fetch conversations from Heymarket API
      const requestBody = {
        id: userId,
        filters,
        ...(lastFetchDate && { date: lastFetchDate }),
      };

      const response = await makeRequest(
        apiKey,
        HttpMethod.POST,
        '/v1/conversations',
        requestBody
      );

      if (!Array.isArray(response)) {
        return [];
      }

      const conversations = response as HeymarketConversation[];

      return conversations.map((conversation) => ({
        epochMilliSeconds: dayjs(conversation.updated).valueOf(),
        data: conversation,
      }));
    } catch (error) {
      console.error('Error fetching conversations from Heymarket:', error);
      return [];
    }
  },
};

export const chatStarted = createTrigger({
  auth: heymarketSmsAuth,
  name: 'chatStarted',
  displayName: 'Conversation Started',
  description:
    'Trigger when a new conversation is started or an existing conversation is updated',
  props: {
    userId: Property.Number({
      displayName: 'User ID',
      description:
        'The Heymarket user ID for verification. This is the ID of a team member who has access to the inboxes.',
      required: true,
    }),
    inboxId: Property.ShortText({
      displayName: 'Inbox IDs',
      description: 'The Heymarket inbox IDs to monitor for new conversations',
      required: true,
    }),
  },
  sampleData: {
    id: 123456,
    inbox: 789,
    name: 'Customer Support Chat',
    status: 'active',
    channel: 'sms',
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-02T12:30:00Z',
    assigned: 111,
    creator: 222,
    members: [
      {
        id: 333,
        name: 'John Doe',
      },
    ],
    read: 1704192600,
    replied: true,
    blocked: false,
    muted: false,
    support: false,
    type: 'customer',
    target: '+15105553344',
    noreply: '',
    snooze_till: '',
    last_inbound: 1704192600,
    email_noti: false,
    local_id: 'conv_123',
    super: 0,
    op: 'update',
  },
  type: TriggerStrategy.POLLING,
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
