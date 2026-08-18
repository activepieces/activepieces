import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { tokportalAuth } from '../auth';
import { WEBHOOK_EVENTS } from '../common/client';
import { tokportalProps } from '../common/props';
import { handleTokPortalWebhook, registerTokPortalWebhook, unregisterTokPortalWebhook } from './common';

const STORE_KEY = 'tokportal_new_webhook_event';

export const newWebhookEvent = createTrigger({
  auth: tokportalAuth,
  name: 'new_webhook_event',
  displayName: 'New Webhook Event',
  description:
    'Triggers on the selected TokPortal webhook event types (bundle, account, video, warming, subscription and credits events).',
  aiMetadata: {
    description:
      'Fires once per TokPortal webhook event of the selected types (for example account.finalized, video.finalized, account.banned), delivering the signed event envelope with its type and data.',
  },
  props: {
    events: tokportalProps.webhookEvents(false),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'evt_0123456789abcdef0123456789abcdef',
    type: 'bundle.published',
    api_version: '2026-05-25',
    created_at: '2026-06-01T12:00:00.000Z',
    data: {
      bundle_id: '9f3a7b2e-1c4d-4e8f-a5b6-7d9e0f1a2b3c',
      external_ref: 'partner-order-123',
      status: 'published',
      platform: 'tiktok',
      bundle_type: 'account_and_videos',
    },
  },
  async onEnable(context) {
    const selected = context.propsValue.events ?? [];
    const events = selected.length > 0 ? selected : WEBHOOK_EVENTS;
    await registerTokPortalWebhook({
      apiKey: context.auth.secret_text,
      store: context.store,
      storeKey: STORE_KEY,
      webhookUrl: context.webhookUrl,
      events,
      description: 'Activepieces trigger: New Webhook Event',
    });
  },
  async onDisable(context) {
    await unregisterTokPortalWebhook({
      apiKey: context.auth.secret_text,
      store: context.store,
      storeKey: STORE_KEY,
    });
  },
  async run(context) {
    return await handleTokPortalWebhook({
      store: context.store,
      storeKey: STORE_KEY,
      payload: context.payload,
    });
  },
});
