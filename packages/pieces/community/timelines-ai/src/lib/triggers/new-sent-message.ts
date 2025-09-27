import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';
import { WebhookInformation } from '../common/types';

export const newSentMessage = createTrigger({
  auth: timelinesAiAuth,
  name: 'newSentMessage',
  displayName: 'New Sent Message',
  description: 'Fires when a message is sent (outgoing).',
  props: {},
  sampleData: {
    event_type: 'message:new',
    chat: {
      full_name: 'Agent Smith',
      chat_url: 'https://app.timelines.ai/chat/123456/messages/',
      chat_id: 123456,
      is_group: false,
      phone: '+123456789',
      responsible_name: 'Agent Brown',
      responsible_email: 'agent-brown@example.com',
    },
    whatsapp_account: {
      full_name: 'Agent Brown',
      email: 'agent-brown@example.com',
      phone: '+123456789',
    },
    message: {
      text: 'Sending some example document to you',
      direction: 'sent',
      origin: 'Public API',
      timestamp: '2024-01-08 10:35:18 +0200',
      message_uid: 'c7ec509d-0171-1ead-a84b-c6943a644768',
      reply_to_uid: 'c7ec509d-0171-1ead-a84b-c6943a644768',
      sender: {
        full_name: 'John Smith',
        phone: '+123456789',
      },
      recipient: {
        full_name: 'John Smith',
        phone: '+123456789',
      },
      attachments: [
        {
          temporary_download_url: 'https://example.s3.amazonaws.com/att/...',
          filename: 'example.doc',
          size: 1234567,
          mimetype: 'application/msword',
        },
      ],
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await timelinesAiCommon.createWebhook({
      apiKey: context.auth as string,
      event_type: 'message:sent:new',
      url: context.webhookUrl,
      enabled: true,
    });
    await context.store.put<WebhookInformation>('_new_sent_message', {
      webhook_id: response.data.id,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInformation>(
      '_new_sent_message'
    );
    const webhook_id = webhookInfo?.webhook_id;
    if (webhook_id) {
      await timelinesAiCommon.deleteWebhook({
        apiKey: context.auth as string,
        webhook_id,
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});


