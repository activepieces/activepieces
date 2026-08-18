import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { tokportalAuth } from '../auth';
import { handleTokPortalWebhook, registerTokPortalWebhook, unregisterTokPortalWebhook } from './common';

const STORE_KEY = 'tokportal_video_posted';

export const videoPosted = createTrigger({
  auth: tokportalAuth,
  name: 'video_posted',
  displayName: 'Video Posted',
  description:
    'Triggers when a video posted by the account manager passes final review (video.finalized), with the live platform_url.',
  aiMetadata: {
    description:
      'Fires once per finalized TokPortal video (video.finalized event) with the bundle_id, position and platform_url of the live post. Optionally also fires on video.in_review as soon as the manager submits the posted URL.',
  },
  props: {
    includeInReview: Property.Checkbox({
      displayName: 'Include In-Review Events',
      description:
        'Also trigger on video.in_review (the manager submitted the posted URL and the video awaits review).',
      required: false,
      defaultValue: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'evt_0123456789abcdef0123456789abcdef',
    type: 'video.finalized',
    api_version: '2026-05-25',
    created_at: '2026-06-01T12:00:00.000Z',
    data: {
      video_id: '11111111-2222-4333-8444-555555555555',
      bundle_id: '9f3a7b2e-1c4d-4e8f-a5b6-7d9e0f1a2b3c',
      position: 1,
      status: 'finalized',
      previous_status: 'in_review',
      platform_url: 'https://www.tiktok.com/@launchprofile/video/123',
    },
  },
  async onEnable(context) {
    const events = context.propsValue.includeInReview
      ? ['video.in_review', 'video.finalized']
      : ['video.finalized'];
    await registerTokPortalWebhook({
      apiKey: context.auth.secret_text,
      store: context.store,
      storeKey: STORE_KEY,
      webhookUrl: context.webhookUrl,
      events,
      description: 'Activepieces trigger: Video Posted',
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
