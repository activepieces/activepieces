import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { createWebhook, deleteWebhook, WebhookResponse } from '../common/client';

export const scheduledProcessTrigger = createTrigger({
  auth: pinchPaymentsAuth,
  name: 'scheduled_process',
  displayName: 'Scheduled Process',
  description: 'Triggers when scheduled payments are processed (daily on business days)',
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
      eventTypes: ['scheduled-process'],
    });

    await context.store.put<WebhookResponse>('pinch_scheduled_process_webhook', webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookResponse>('pinch_scheduled_process_webhook');
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
    type: 'scheduled-process',
    eventDate: '2024-01-15T10:30:00Z',
    metadata: {},
    data: {
      payments: [
        {
          id: 'pay_sample123456',
          amount: 5000,
          status: 'processing',
          transactionDate: '2024-01-15',
          payer: {
            id: 'pyr_sample123456',
            firstName: 'John',
            lastName: 'Doe',
            emailAddress: 'john.doe@example.com',
          },
        },
      ],
    },
  },
});
