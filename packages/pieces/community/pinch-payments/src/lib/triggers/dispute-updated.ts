import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { createWebhook, deleteWebhook, WebhookResponse } from '../common/client';

export const disputeUpdatedTrigger = createTrigger({
  auth: pinchPaymentsAuth,
  name: 'dispute_updated',
  displayName: 'Dispute Updated',
  description: 'Triggers when a dispute is updated',
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
      eventTypes: ['dispute-updated'],
    });

    await context.store.put<WebhookResponse>('pinch_dispute_updated_webhook', webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookResponse>('pinch_dispute_updated_webhook');
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
    type: 'dispute-updated',
    eventDate: '2024-01-15T10:30:00Z',
    metadata: {},
    data: {
      dispute: {
        id: 'dsp_sample123456',
        amount: 5000,
        status: 'resolved',
        paymentId: 'pay_sample123456',
      },
    },
  },
});
