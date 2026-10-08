import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatWebhooks } from '../common/webhooks';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatSamples } from '../common/samples';

export const newDirectMessageTrigger = createTrigger({
  auth: heartbeatAuth,
  name: 'heartbeat_new_direct_message',
  displayName: 'New Direct Message to Admin',
  description: 'Fires when a chosen admin receives a direct message.',
  classification: 'READ',
  aiMetadata: {
    description: 'Fires once when the chosen admin receives a direct message and returns the chat ID, the sender ID (from the stored message), the receiver ID (the chosen admin) and the message (content, time, attachments), re-read from Heartbeat. Messages the admin sent, and chats that are not between the admin and the sender, are ignored.',
  },
  props: {
    adminUserId: heartbeatProps.id({ displayName: 'Admin User ID', description: 'The admin whose incoming direct messages fire this trigger. Use List Members (Admins Only) to find the ID.', required: true }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: heartbeatSamples.directMessage,
  outputSchema: heartbeatOutputSchemas.directMessageEvent,
  async onEnable(context) {
    await heartbeatWebhooks.enable({
      token: context.auth.secret_text,
      store: context.store,
      webhookUrl: context.webhookUrl,
      action: { name: 'DIRECT_MESSAGE', filter: { userID: heartbeatApi.uuid({ value: context.propsValue.adminUserId, label: 'Admin User ID' }) } },
    });
  },
  async onDisable(context) {
    await heartbeatWebhooks.disable({ token: context.auth.secret_text, store: context.store });
  },
  async run(context) {
    const payload = heartbeatWebhooks.payloadOf(context.payload.body);
    const chatId = heartbeatWebhooks.uuidOrNull(payload['chatID']);
    const messageId = heartbeatWebhooks.uuidOrNull(payload['chatMessageID']);
    if (chatId === null || messageId === null) {
      return [];
    }
    const messages = await heartbeatWebhooks.fetchOrNull(async () =>
      heartbeatApi.recordList(
        await heartbeatApi.request<unknown>({ token: context.auth.secret_text, method: HttpMethod.GET, path: `/directMessages/${chatId}`, operation: 'list direct messages' }),
      ),
    );
    const message = messages?.find((item) => item['id'] === messageId) ?? null;
    const adminUserId = heartbeatApi.uuid({ value: context.propsValue.adminUserId, label: 'Admin User ID' });
    const senderUserId = typeof message?.['userID'] === 'string' ? message['userID'] : null;
    if (message === null || senderUserId === null || senderUserId === adminUserId) {
      return [];
    }
    if (!(await isAdminChat({ token: context.auth.secret_text, chatId, adminUserId, senderUserId, messages: messages ?? [] }))) {
      return [];
    }
    if (!(await heartbeatWebhooks.isFirstDelivery({ store: context.store, key: `DIRECT_MESSAGE:${messageId}` }))) {
      return [];
    }
    return [
      {
        chatId,
        messageId,
        senderUserId,
        receiverUserId: adminUserId,
        content: message['content'] ?? null,
        createdAt: message['createdAt'] ?? null,
        images: message['images'] ?? [],
        files: message['files'] ?? [],
      },
    ];
  },
});

async function isAdminChat({ token, chatId, adminUserId, senderUserId, messages }: AdminChatCheck): Promise<boolean> {
  const onlyTheTwo = messages.every((item) => item['userID'] === adminUserId || item['userID'] === senderUserId);
  if (!onlyTheTwo) {
    return false;
  }
  if (messages.some((item) => item['userID'] === adminUserId)) {
    return true;
  }
  const chat = await heartbeatApi.request<unknown>({
    token,
    method: HttpMethod.PUT,
    path: '/directChats',
    operation: 'confirm direct chat',
    body: { userID1: adminUserId, userID2: senderUserId },
  });
  return heartbeatApi.isRecord(chat) && chat['chatID'] === chatId;
}

type AdminChatCheck = {
  token: string;
  chatId: string;
  adminUserId: string;
  senderUserId: string;
  messages: Record<string, unknown>[];
};
