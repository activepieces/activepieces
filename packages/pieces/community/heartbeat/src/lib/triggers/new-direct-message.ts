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
    description: 'Fires once when the chosen admin receives a direct message and returns the chat ID, sender and receiver IDs and the message (content, time, attachments), re-read from Heartbeat.',
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
    if (message === null) {
      return [];
    }
    if (!(await heartbeatWebhooks.isFirstDelivery({ store: context.store, key: `DIRECT_MESSAGE:${messageId}` }))) {
      return [];
    }
    return [
      {
        chatId,
        messageId,
        senderUserId: message['userID'] ?? heartbeatWebhooks.uuidOrNull(payload['senderUserID']),
        receiverUserId: heartbeatWebhooks.uuidOrNull(payload['receiverUserID']),
        content: message['content'] ?? null,
        createdAt: message['createdAt'] ?? null,
        images: message['images'] ?? [],
        files: message['files'] ?? [],
      },
    ];
  },
});
