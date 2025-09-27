import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { timelinesaiAuth } from '../common/auth';
import { newIncomingChat as newIncomingChatProps } from '../common/properties';

const polling: Polling<any, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const { timelinesaiCommon } = await import('../common/client');

    const isTest = lastFetchEpochMS === 0;
    const params: any = {
      limit: isTest ? 10 : 50,
    };

    if (propsValue.whatsapp_account_id) {
      params.whatsapp_account_id = propsValue.whatsapp_account_id;
    }

    const chats = await timelinesaiCommon.getChats({ auth, ...params }) as any[];

    const incomingChats = chats.filter((chat: any) => {
      // Filter for incoming chats (chats initiated by customers)
      // Assuming direction field exists, adjust based on actual API
      const isIncoming = chat.direction === 'incoming' || chat.initiated_by === 'customer';
      const createdAfterLastFetch = !lastFetchEpochMS || new Date(chat.created_at).getTime() > lastFetchEpochMS;

      return isIncoming && (isTest || createdAfterLastFetch);
    });

    return incomingChats.map((chat: any) => ({
      epochMilliSeconds: new Date(chat.created_at).getTime(),
      data: chat,
    }));
  },
};

export const newIncomingChat = createTrigger({
  auth: timelinesaiAuth,
  name: 'newIncomingChat',
  displayName: 'New Incoming Chat',
  description: 'Fires when a new incoming chat (i.e. from a user) is created',
  props: newIncomingChatProps(),
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
    id: 'chat_123',
    whatsapp_account_id: 'wa_456',
    phone_number: '+1234567890',
    name: 'John Doe',
    direction: 'incoming',
    status: 'open',
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
  },
});
