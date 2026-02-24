import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { createWebhook, deleteWebhook, WebhookResponse } from '../common/client';

export const transferTrigger = createTrigger({
  auth: pinchPaymentsAuth,
  name: 'transfer',
  displayName: 'Transfer Created',
  description: 'Triggers when a transfer is created to settle funds to a merchant',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const credentials = {
      username: context.auth.props.username,
      password: context.auth.props.password,
    };

    const webhook = await createWebhook(credentials, {
      uri: context.webhookUrl,
      webhookFormat: 'camel-case',
      eventTypes: ['transfer'],
    });

    await context.store.put<WebhookResponse>('pinch_transfer_webhook', webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookResponse>('pinch_transfer_webhook');
    if (webhook) {
      const credentials = {
        username: context.auth.props.username,
        password: context.auth.props.password,
      };
      await deleteWebhook(credentials, webhook.id);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    id: 'evt_sample123456',
    type: 'transfer',
    eventDate: '2024-01-15T10:30:00Z',
    metadata: {},
    data: {
      transfer: {
        id: 'tfr_sample123456',
        amount: 50000,
        currency: 'AUD',
        status: 'completed',
      },
    },
  },
});
