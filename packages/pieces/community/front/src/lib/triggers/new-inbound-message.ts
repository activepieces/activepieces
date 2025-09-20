import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const WEBHOOK_EVENT_TYPE = 'inbound_message';

export const newInboundMessage = createTrigger({
  auth: frontAuth,
  name: 'new_inbound_message',
  displayName: 'New Inbound Message',
  description: 'Fires when a new message is received in a shared inbox.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'msg_klmno789',
    type: 'email',
    is_inbound: true,
    created_at: 1678886401.456,
    subject: 'Question about my recent order',
    blurb: 'Hi there, I was wondering if you could help me...',
    body: '<p>Hi there, I was wondering if you could help me with my recent order #12345.</p>',
    conversation: {
      id: 'cnv_fghij456',
      subject: 'Question about my recent order',
      status: 'unassigned',
    },
  },

  async onEnable(context) {
    const token = context.auth;
    const response = await makeRequest<{ id: string }>(
      token,
      HttpMethod.POST,
      '/events',
      {
        target_url: context.webhookUrl,
        events: [WEBHOOK_EVENT_TYPE],
      }
    );

    await context.store.put(`front_inbound_message_webhook`, {
      webhookId: response.id,
    });
  },

  async onDisable(context) {
    const token = context.auth;
    const webhookData = await context.store.get<{ webhookId: string }>(
      `front_inbound_message_webhook`
    );

    if (webhookData?.webhookId) {
      await makeRequest(
        token,
        HttpMethod.DELETE,
        `/events/${webhookData.webhookId}`
      );
      await context.store.delete(`front_inbound_message_webhook`);
    }
  },

  async run(context) {
    const eventPayload = context.payload.body as { payload: unknown };
    return [eventPayload.payload];
  },
});
