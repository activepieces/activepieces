import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  ollabearAuth,
  registerWebhook,
  unregisterWebhook,
  coerceAuth,
  getStoredSecret,
  verifyDelivery,
} from './common';

// Every Ollabear trigger is the same shape: on enable it POSTs a webhook
// subscription for one event type to /v1/integrations/webhooks (pointing at
// the unique, unguessable Activepieces flow URL), stores the returned HMAC
// secret, and on disable it deletes the subscription. The factory keeps the
// three of them in lockstep.
//
// Security: deliveries are HMAC-SHA256 signed (X-Webhook-Signature). run()
// verifies the signature against the stored secret + raw body and DROPS any
// delivery that fails — so a leaked/guessed webhook URL can't inject events.
// (Falls back to accept only when the runtime can't supply rawBody; see
// verifyDelivery.)

function ollabearWebhookTrigger(opts: {
  name: string;
  event: string;
  displayName: string;
  description: string;
  sampleData: Record<string, unknown>;
}) {
  return createTrigger({
    auth: ollabearAuth,
    name: opts.name,
    displayName: opts.displayName,
    description: opts.description,
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: opts.sampleData,
    async onEnable(context) {
      await registerWebhook(
        coerceAuth(context.auth),
        context.store,
        context.webhookUrl,
        [opts.event],
      );
    },
    async onDisable(context) {
      await unregisterWebhook(coerceAuth(context.auth), context.store);
    },
    async run(context) {
      // Verify the HMAC signature before trusting the delivery; drop on
      // mismatch so only genuinely Ollabear-signed events flow downstream.
      const secret = await getStoredSecret(context.store);
      if (!verifyDelivery(context.payload, secret)) {
        return [];
      }
      // Ollabear POSTs the event envelope as the request body; surface it
      // verbatim as the single item this trigger produces.
      return [context.payload.body];
    },
  });
}

export const conversationCreated = ollabearWebhookTrigger({
  name: 'conversation_created',
  event: 'conversation.created',
  displayName: 'Conversation Created',
  description: 'Fires when a new conversation starts (e.g. a visitor opens the widget).',
  sampleData: {
    event: 'conversation.created',
    conversation: {
      id: '7e1609bf-9199-4b8a-8b89-4b859ea0f937',
      status: 'active',
      subject: 'Pricing question',
      tags: [],
      created_at: '2026-06-09T12:00:00Z',
    },
  },
});

export const conversationClosed = ollabearWebhookTrigger({
  name: 'conversation_closed',
  event: 'conversation.closed',
  displayName: 'Conversation Closed',
  description: 'Fires when a conversation is closed — good for CSAT, CRM sync, follow-up.',
  sampleData: {
    event: 'conversation.closed',
    conversation: {
      id: '7e1609bf-9199-4b8a-8b89-4b859ea0f937',
      status: 'closed',
      subject: 'Pricing question',
      tags: ['resolved'],
      closed_at: '2026-06-09T12:15:00Z',
    },
  },
});

export const messageCreated = ollabearWebhookTrigger({
  name: 'message_created',
  event: 'message.created',
  displayName: 'New Message',
  description: 'Fires on every new message (visitor or bot) in any conversation.',
  sampleData: {
    event: 'message.created',
    message: {
      id: 'b1d2c3e4-0000-4000-8000-000000000000',
      conversation_id: '7e1609bf-9199-4b8a-8b89-4b859ea0f937',
      role: 'visitor',
      content: 'Do you offer annual billing?',
      created_at: '2026-06-09T12:01:00Z',
    },
  },
});
