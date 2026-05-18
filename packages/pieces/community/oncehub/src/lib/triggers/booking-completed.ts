import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { on } from 'events';
import { oncehubAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
export const bookingCompleted = createTrigger({
  auth: oncehubAuth,
  name: 'bookingCompleted',
  displayName: 'Booking Completed',
  description: 'Triggered when booking end time has passed.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const api_key = context.auth.secret_text;
    const { webhookUrl } = context;

    const response = await makeRequest(api_key, HttpMethod.POST, '/webhooks', {
      url: webhookUrl,
      name: `Booking Completed Webhook - ${new Date().getTime()}`,
      events: ['booking.completed'],
    });

    await context.store.put('webhookId_bookingCompleted', response.id);
  },
  async onDisable(context) {
    const api_key = context.auth.secret_text;
    const webhookId = await context.store.get<string>(
      'webhookId_bookingCompleted'
    );

    if (webhookId) {
      await makeRequest(api_key, HttpMethod.DELETE, `/webhooks/${webhookId}`);
    }

    await context.store.delete('webhookId_bookingCompleted');
  },
  async run(context) {
    return [context.payload.body];
  },
});
