import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { WebhookHandshakeStrategy } from '@activepieces/shared';

import { cannyAuth } from '../auth';

export type CannyEventType =
  | 'post.created'
  | 'post.status_changed'
  | 'comment.created'
  | 'vote.created';

export function createCannyTrigger({
  name,
  displayName,
  description,
  eventType,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  eventType: CannyEventType;
  sampleData: unknown;
}) {
  return createTrigger({
    auth: cannyAuth,
    name,
    displayName,
    description,
    props: {},
    sampleData,
    type: TriggerStrategy.WEBHOOK,
    handshakeConfiguration: { strategy: WebhookHandshakeStrategy.NONE },
    async onEnable(_context) {
      // Canny webhooks must be configured manually in the Canny dashboard.
      // Point the webhook URL to this trigger's webhook URL.
    },
    async onDisable(_context) {
      // Nothing to clean up — webhooks are managed manually in Canny.
    },
    async run(context) {
      const payload = context.payload.body as { type?: string };
      if (payload?.type !== eventType) return [];
      return [payload];
    },
  });
}
