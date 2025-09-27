import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { timelinesaiAuth } from '../common/auth';
import { newSentMessage as newSentMessageProps } from '../common/properties';

const polling: Polling<any, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const { timelinesaiCommon } = await import('../common/client');

    const isTest = lastFetchEpochMS === 0;

    let messages: any[] = [];

    if (propsValue.chat_id) {
      // Get messages from specific chat
      messages = await timelinesaiCommon.getMessages({
        auth,
        chatId: propsValue.chat_id,
        limit: isTest ? 10 : 50,
      }) as any[];
    } else if (propsValue.whatsapp_account_id) {
      // Get chats from account and then messages from each chat
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

    const sentMessages = messages.filter((message: any) => {
      // Filter for sent messages (outgoing)
      const isSent = message.direction === 'outgoing' || message.from_me === true;
      const sentAfterLastFetch = !lastFetchEpochMS || new Date(message.created_at).getTime() > lastFetchEpochMS;

      return isSent && (isTest || sentAfterLastFetch);
    });

    return sentMessages.map((message: any) => ({
      epochMilliSeconds: new Date(message.created_at).getTime(),
      data: message,
    }));
  },
};

export const newSentMessage = createTrigger({
  auth: timelinesaiAuth,
  name: 'newSentMessage',
  displayName: 'New Sent Message',
  description: 'Fires when a message is sent (outgoing)',
  props: newSentMessageProps(),
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
    content: 'Hello! How can I help you?',
    direction: 'outgoing',
    message_type: 'text',
    status: 'sent',
    created_at: '2024-01-01T12:00:00Z',
  },
});
