import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { timelinesaiAuth } from '../common/auth';
import { chatClosed as chatClosedProps } from '../common/properties';

const polling: Polling<any, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const { timelinesaiCommon } = await import('../common/client');

    const isTest = lastFetchEpochMS === 0;
    const params: any = {
      limit: isTest ? 10 : 50,
      status: 'closed',
    };

    if (propsValue.whatsapp_account_id) {
      params.whatsapp_account_id = propsValue.whatsapp_account_id;
    }

    const chats = await timelinesaiCommon.getChats({ auth, ...params }) as any[];

    const closedChats = chats.filter((chat: any) => {
      const closedAfterLastFetch = !lastFetchEpochMS || new Date(chat.closed_at || chat.updated_at).getTime() > lastFetchEpochMS;
      return isTest || closedAfterLastFetch;
    });

    return closedChats.map((chat: any) => ({
      epochMilliSeconds: new Date(chat.closed_at || chat.updated_at).getTime(),
      data: chat,
    }));
  },
};

export const chatClosed = createTrigger({
  auth: timelinesaiAuth,
  name: 'chatClosed',
  displayName: 'Chat Closed',
  description: 'Fires when a chat is closed',
  props: chatClosedProps(),
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
    status: 'closed',
    closed_at: '2024-01-01T12:00:00Z',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
  },
});
