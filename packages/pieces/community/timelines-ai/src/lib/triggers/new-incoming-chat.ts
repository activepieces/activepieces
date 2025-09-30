import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';
import { WebhookInformation } from '../common/types';

export const newIncomingChat = createTrigger({
  auth: timelinesAiAuth,
  name: 'newIncomingChat',
  displayName: 'New Incoming Chat',
  description: 'Fires when a new incoming chat (i.e. from a user) is created.',
  props: {},
  sampleData: {
    event_type: 'chat:new',
    chat: {
      id: 123456,
      name: 'John Smith',
      phone: '+123456789',
      jid: '123456789@s.whatsapp.net',
      is_group: false,
      closed: false,
      read: false,
      labels: ['string'],
      unattended_customer: false,
      chatgpt_autoresponse_enabled: false,
      whatsapp_account_id: '123456789@s.whatsapp.net',
      chat_url: 'https://app.timelines.ai/chat/123456/messages/',
      created_timestamp: '2024-01-08 10:35:18 +0200',
      last_message_uid: 'afa9d4dd-978d-4a14-aa1b-bd65c272e645',
      last_message_timestamp: '2024-01-08 10:35:18 +0200',
      responsible_name: 'Agent Brown',
      responsible_email: 'agent-brown@example.com',
      previous_responsible_name: 'Agent Jones',
      previous_responsible_email: 'agent-jones@example.com',
    },
    whatsapp_account: {
      id: '123456789@s.whatsapp.net',
      phone: '+123456789',
      connected_on: '2024-01-08 10:35:18 +0200',
      disconnected_on: '2024-01-08 10:35:18 +0200',
      status: 'active',
      account_name: 'Some account',
      owner_name: 'Agent Smith',
      owner_email: 'agent-smith@example.com',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await timelinesAiCommon.createWebhook({
      apiKey: context.auth as string,
      event_type: 'chat:incoming:new',
      url: context.webhookUrl,
      enabled: true,
    });
    await context.store.put<WebhookInformation>('_new_incoming_chat', {
      webhook_id: response.data.id,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInformation>(
      '_new_incoming_chat'
    );
    const webhook_id = webhookInfo?.webhook_id;
    if (webhook_id) {
      await timelinesAiCommon.deleteWebhook({
        apiKey: context.auth as string,
        webhook_id: webhook_id as number,
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
