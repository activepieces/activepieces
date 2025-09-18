import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const WEBHOOK_EVENTS = ['outbound_message', 'outbound_reply'];

export const newOutboundMessage = createTrigger({
  auth: frontAuth,
  name: 'new_outbound_message',
  displayName: 'New Outbound Message',
  description: 'Fires when a new message is sent or replied to in Front.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'msg_pqrst012',
    type: 'email',
    is_inbound: false,
    created_at: 1678886403.123,
    subject: 'Re: Question about my recent order',
    blurb: "Hi Customer, we've checked on your order...",
    author: {
      id: 'tea_xyz789',
      email: 'agent@yourcompany.com',
      username: 'support_agent',
    },
    body: "<p>Hi Customer, we've checked on your order and it is scheduled to ship tomorrow.</p>",
    conversation: {
      id: 'cnv_fghij456',
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
        events: WEBHOOK_EVENTS,
      }
    );

    await context.store.put(`front_outbound_message_webhook`, {
      webhookId: response.id,
    });
  },

  async onDisable(context) {
    const token = context.auth;
    const webhookData = await context.store.get<{ webhookId: string }>(
      `front_outbound_message_webhook`
    );

    if (webhookData?.webhookId) {
      await makeRequest(
        token,
        HttpMethod.DELETE,
        `/events/${webhookData.webhookId}`
      );
      await context.store.delete(`front_outbound_message_webhook`);
    }
  },

  async run(context) {
    const eventPayload = context.payload.body as { payload: unknown };
    return [eventPayload.payload];
  },
});
