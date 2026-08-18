import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { tokportalAuth } from '../auth';
import { handleTokPortalWebhook, registerTokPortalWebhook, unregisterTokPortalWebhook } from './common';

const STORE_KEY = 'tokportal_account_delivered';
const EVENTS = ['account.finalized'];

export const accountDelivered = createTrigger({
  auth: tokportalAuth,
  name: 'account_delivered',
  displayName: 'Account Delivered',
  description: 'Triggers when a managed account is finalized and delivered to your workspace.',
  aiMetadata: {
    description:
      'Fires once per delivered TokPortal account (account.finalized event) with the bundle_id, saved_account_id, username and platform. Use it to start work on a freshly created account.',
  },
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'evt_0123456789abcdef0123456789abcdef',
    type: 'account.finalized',
    api_version: '2026-05-25',
    created_at: '2026-06-01T12:00:00.000Z',
    data: {
      account_id: '0d1e2f3a-4b5c-6789-8abc-def012345678',
      saved_account_id: '7c9e0f1a-2b3c-4d5e-8f6a-1b2c3d4e5f60',
      bundle_id: '9f3a7b2e-1c4d-4e8f-a5b6-7d9e0f1a2b3c',
      username: 'launchprofile',
      platform: 'tiktok',
      status: 'finalized',
      previous_status: 'in_review',
    },
  },
  async onEnable(context) {
    await registerTokPortalWebhook({
      apiKey: context.auth.secret_text,
      store: context.store,
      storeKey: STORE_KEY,
      webhookUrl: context.webhookUrl,
      events: EVENTS,
      description: 'Activepieces trigger: Account Delivered',
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
      allowedEvents: EVENTS,
    });
  },
});
