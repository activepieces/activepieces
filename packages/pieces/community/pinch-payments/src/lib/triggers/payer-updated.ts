import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { createWebhook, deleteWebhook, WebhookResponse } from '../common/client';

export const payerUpdatedTrigger = createTrigger({
  auth: pinchPaymentsAuth,
  name: 'payer_updated',
  displayName: 'Payer Updated',
  description: 'Triggers when a payer record is updated',
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
      eventTypes: ['payer-updated'],
    });

    await context.store.put<WebhookResponse>('pinch_payer_updated_webhook', webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookResponse>('pinch_payer_updated_webhook');
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
    type: 'payer-updated',
    eventDate: '2024-01-15T10:30:00Z',
    metadata: {},
    data: {
      payer: {
        id: 'pyr_sample123456',
        firstName: 'John',
        lastName: 'Doe',
        emailAddress: 'john.doe@example.com',
        mobileNumber: '0412345678',
        streetAddress: '123 Main St',
        suburb: 'Sydney',
        postcode: '2000',
        state: 'NSW',
        country: 'AU',
      },
    },
  },
});
