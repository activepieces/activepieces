import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wavixAuth } from '../common/auth';
import { wavixApiCall } from '../common/client';

const STORE_KEY = 'previous_post_call_url';

export const callCompleted = createTrigger({
  auth: wavixAuth,
  name: 'call_completed',
  classification: 'READ',
  displayName: 'Call Completed',
  description:
    'Fires when a call on your account ends — inbound or outbound — with its duration and charge. Uses the account-level post-call webhook, so only one flow per account should own this trigger.',
  aiMetadata: {
    description:
      'Fires when any call on the account completes (inbound or outbound, placed by any means). The payload includes direction, call uuid, destination, duration and charge.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    // Capture any existing post-call webhook once so disable can restore it.
    const alreadyStored = await context.store.get<string>(STORE_KEY);
    if (alreadyStored === null) {
      const webhooks = await wavixApiCall<{ event_type: string; url: string }[]>(
        {
          apiKey: context.auth.secret_text,
          method: HttpMethod.GET,
          resourcePath: '/v1/calls/webhooks',
        }
      );
      const prior =
        webhooks.find((w) => w.event_type === 'post-call')?.url ?? '';
      await context.store.put<string>(STORE_KEY, prior);
    }
    await wavixApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourcePath: '/v1/calls/webhooks',
      body: { url: context.webhookUrl, event_type: 'post-call' },
    });
  },
  async onDisable(context) {
    // Not captured => onEnable never registered; leave it alone.
    const previous = await context.store.get<string>(STORE_KEY);
    if (previous === null) {
      return;
    }
    try {
      if (previous) {
        await wavixApiCall({
          apiKey: context.auth.secret_text,
          method: HttpMethod.POST,
          resourcePath: '/v1/calls/webhooks',
          body: { url: previous, event_type: 'post-call' },
        });
      } else {
        await wavixApiCall({
          apiKey: context.auth.secret_text,
          method: HttpMethod.DELETE,
          resourcePath: '/v1/calls/webhooks',
          query: { event_type: 'post-call' },
        });
      }
      await context.store.delete(STORE_KEY);
    } catch {
      // Best-effort cleanup: keep STORE_KEY so a later retry can restore.
    }
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
