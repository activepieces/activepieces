import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wavixAuth } from '../common/auth';
import { wavixWebhook } from '../common/webhook';

export const callCompleted = createTrigger({
  auth: wavixAuth,
  name: 'call_completed',
  classification: 'READ',
  displayName: 'Call Completed',
  description:
    'Fires when a call on your account ends — inbound or outbound — with its duration and charge. Uses the account-level post-call webhook, so this trigger will not start if that webhook is already set — clear it in Wavix first.',
  aiMetadata: {
    description:
      'Fires when any call on the account completes (inbound or outbound, placed by any means). The payload includes direction, call uuid, destination, duration and charge.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    await wavixWebhook.claim({
      request: {
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        resourcePath: '/v1/calls/webhooks',
        body: {
          url: context.webhookUrl,
          event_type: 'post-call',
          expected_url: '',
        },
      },
      inUseMessage:
        'This Wavix account already has a post-call webhook set. It can feed only one destination — disable the flow that set it, or clear the post-call webhook, before enabling this trigger.',
    });
  },
  async onDisable(context) {
    await wavixWebhook.release({
      request: {
        apiKey: context.auth.secret_text,
        method: HttpMethod.DELETE,
        resourcePath: '/v1/calls/webhooks',
        query: { event_type: 'post-call', expected_url: context.webhookUrl },
      },
      failureMessage:
        'Could not clear the post-call webhook on this Wavix account; clear it so the account can be reused.',
    });
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    direction: 'inbound',
    uuid: '11111111-1111-1111-1111-111111111111',
    disposition: 'answered',
    from: '+15555550110',
    to: '+15555550111',
    destination: 'France',
    duration: 6,
    per_minute: '0.137',
    charge: '0.822',
    date: '2025-09-22T12:56:38.547Z',
  },
});
