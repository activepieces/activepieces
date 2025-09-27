import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { timelinesaiAuth } from '../common/auth';
import { newReceivedMessage as newReceivedMessageProps } from '../common/properties';

const polling: Polling<any, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const { timelinesaiCommon } = await import('../common/client');

    const isTest = lastFetchEpochMS === 0;

    let messages: any[] = [];

    if (propsValue.chat_id) {
      messages = await timelinesaiCommon.getMessages({
        auth,
        chatId: propsValue.chat_id,
        limit: isTest ? 10 : 50,
      }) as any[];
    } else if (propsValue.whatsapp_account_id) {
      const chats = await timelinesaiCommon.getChats({
        auth,
        whatsapp_account_id: propsValue.whatsapp_account_id,
        limit: 20,
      }) as any[];

      for (const chat of chats) {
        const chatMessages = await timelinesaiCommon.getMessages({
          auth,
          chatId: chat.id,
          limit: isTest ? 5 : 10,
        }) as any[];
        messages.push(...chatMessages);
      }
    }

    const receivedMessages = messages.filter((message: any) => {
      const isReceived = message.direction === 'incoming' || message.from_me === false;
      const receivedAfterLastFetch = !lastFetchEpochMS || new Date(message.created_at).getTime() > lastFetchEpochMS;

      return isReceived && (isTest || receivedAfterLastFetch);
    });

    return receivedMessages.map((message: any) => ({
      epochMilliSeconds: new Date(message.created_at).getTime(),
      data: message,
    }));
  },
};

export const newReceivedMessage = createTrigger({
  auth: timelinesaiAuth,
  name: 'newReceivedMessage',
  displayName: 'New Received Message',
  description: 'Fires when a message is received (incoming)',
  props: newReceivedMessageProps(),
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
    id: 'msg_123',
    chat_id: 'chat_456',
    content: 'Hi, I need help with my order',
    direction: 'incoming',
    message_type: 'text',
    status: 'delivered',
    created_at: '2024-01-01T12:00:00Z',
  },
});
