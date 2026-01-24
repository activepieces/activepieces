import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';
import { WebhookInformation } from '../common/types';

export const newWhatsappAccount = createTrigger({
  auth: timelinesAiAuth,
  name: 'newWhatsappAccount',
  displayName: 'New WhatsApp Account',
  description: 'Fires when a new WhatsApp account is added/registered.',
  props: {},
  sampleData: {
    event_type: 'whatsapp:account:connected',
    whatsapp_account: {
      id: '123456789@s.whatsapp.net',
      phone: '+123456789',
      connected_on: '2024-01-08 10:35:18 +0200',
      disconnected_on: '2024-01-08 10:35:18 +0200',
      status: 'active',
      account_name: 'Smith',
      owner_name: 'John Smith',
      owner_email: 'john-smith@example.com',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await timelinesAiCommon.createWebhook({
      apiKey: context.auth,
      event_type: 'whatsapp:account:connected',
      url: context.webhookUrl,
      enabled: true,
    });
    await context.store.put<WebhookInformation>('_new_whatsapp_account', {
      webhook_id: response.data.id,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInformation>(
      '_new_whatsapp_account'
    );
    const webhook_id = webhookInfo?.webhook_id;
    if (webhook_id) {
      await timelinesAiCommon.deleteWebhook({
        apiKey: context.auth,
        webhook_id: webhook_id,
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
