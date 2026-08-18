import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { tokportalAuth } from '../auth';
import { handleTokPortalWebhook, registerTokPortalWebhook, unregisterTokPortalWebhook } from './common';

const STORE_KEY = 'tokportal_account_banned';
const EVENTS = ['account.banned'];

export const accountBanned = createTrigger({
  auth: tokportalAuth,
  name: 'account_banned',
  displayName: 'Account Banned',
  description:
    'Triggers when one of your managed accounts is banned by the platform (no appeal available or appeal refused).',
  aiMetadata: {
    description:
      'Fires once per banned TokPortal account (account.banned event) with the saved_account_id, username, platform, reason and appeal_status. Use List Account Bans to follow the resolution afterwards.',
  },
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'evt_0123456789abcdef0123456789abcdef',
    type: 'account.banned',
    api_version: '2026-05-25',
    created_at: '2026-07-03T10:15:00.000Z',
    data: {
      bundle_id: '9f3a7b2e-1c4d-4e8f-a5b6-7d9e0f1a2b3c',
      saved_account_id: '7c9e0f1a-2b3c-4d5e-8f6a-1b2c3d4e5f60',
      username: 'launchprofile',
      platform: 'tiktok',
      reason: 'Community guidelines violation notice shown in-app',
      appeal_status: 'appeal_refused',
      banned_at: '2026-07-03T10:15:00Z',
    },
  },
  async onEnable(context) {
    await registerTokPortalWebhook({
      apiKey: context.auth.secret_text,
      store: context.store,
      storeKey: STORE_KEY,
      webhookUrl: context.webhookUrl,
      events: EVENTS,
      description: 'Activepieces trigger: Account Banned',
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
