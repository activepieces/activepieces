import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { snapdubAuth } from '../auth';
import { snapdubClient, SnapDubVideo } from '../common/client';
import {
  snapdubWebhook,
  StoredWebhook,
  WEBHOOK_STORE_KEY,
} from '../common/webhook';

export const videoFailedTrigger = createTrigger({
  auth: snapdubAuth,
  name: 'video_failed',
  classification: 'READ',
  displayName: 'Video Failed',
  description:
    'Triggers when a video could not be processed. Its credits go back to your account.',
  aiMetadata: {
    description:
      'Fires once per SnapDub video that could not be processed (video.failed). One payload is the video with its status "failed" and an error in plain words; the credits it cost are refunded automatically.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    event: 'video.failed',
    delivery_id: 'evt_3Hc8wRt5YnB2qZ6k',
    delivered_at: '2026-10-22T12:09:44Z',
    video_id: '9f3c2a71',
    title: 'Episode 41',
    kind: 'best moments, scored',
    status: 'failed',
    progress_percent: 0,
    clips_ready: 0,
    created_at: '2026-10-22T12:02:11Z',
    error: 'The video is private, so it could not be downloaded.',
    url: 'https://snapdub.ai/videos/9f3c2a71',
  },
  async onEnable(context) {
    const webhook = await snapdubWebhook.subscribe({
      apiKey: context.auth.secret_text,
      webhookUrl: context.webhookUrl,
      event: 'video.failed',
    });
    await context.store.put<StoredWebhook>(WEBHOOK_STORE_KEY, webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<StoredWebhook>(WEBHOOK_STORE_KEY);
    if (webhook?.webhookId) {
      await snapdubWebhook.unsubscribe({
        apiKey: context.auth.secret_text,
        webhookId: webhook.webhookId,
      });
    }
    await context.store.delete(WEBHOOK_STORE_KEY);
  },
  async run(context) {
    const webhook = await context.store.get<StoredWebhook>(WEBHOOK_STORE_KEY);
    return snapdubWebhook.parseDelivery({
      payload: context.payload,
      event: 'video.failed',
      secret: webhook?.secret,
    });
  },
  async test(context) {
    const { videos } = await snapdubClient.call<{ videos?: SnapDubVideo[] }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/videos',
    });
    return (videos ?? [])
      .filter((video) => video.status === 'failed')
      .slice(0, TEST_LIMIT)
      .map((video) => ({ event: 'video.failed', ...video }));
  },
});

const TEST_LIMIT = 3;
