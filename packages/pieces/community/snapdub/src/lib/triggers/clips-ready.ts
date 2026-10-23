import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { snapdubAuth } from '../auth';
import {
  snapdubClient,
  SnapDubVideo,
  SnapDubVideoWithClips,
} from '../common/client';
import {
  snapdubWebhook,
  StoredWebhook,
  WEBHOOK_STORE_KEY,
} from '../common/webhook';

export const clipsReadyTrigger = createTrigger({
  auth: snapdubAuth,
  name: 'clips_ready',
  classification: 'READ',
  displayName: 'Clips Ready',
  description:
    'Triggers when a video finishes and its clips are ready, best clips first, with download links.',
  aiMetadata: {
    description:
      'Fires once per SnapDub video when processing finishes successfully (video.completed). One payload is the whole video with all its clips, best first; each clip has a clip_id, title, virality score, description, hashtags and a download link valid for one hour.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    event: 'video.completed',
    delivery_id: 'evt_7Qm2xVb9KpL4sN1d',
    delivered_at: '2026-10-22T12:41:05Z',
    video_id: '9f3c2a71',
    title: 'Episode 41',
    kind: 'best moments, scored',
    status: 'done',
    progress_percent: 100,
    duration_seconds: 3480,
    clips_ready: 2,
    created_at: '2026-10-22T12:02:11Z',
    url: 'https://snapdub.ai/videos/9f3c2a71',
    clips: [
      {
        clip_id: 'a1b2c3d4',
        title: 'The 10,000 hour lie',
        virality_score: 94,
        description: 'Why most people quit right before it works.',
        hashtags: '#podcast #motivation',
        duration_seconds: 42.0,
        download_url: 'https://cdn.snapdub.ai/clips/a1b2c3d4.mp4',
        thumbnail_url: 'https://cdn.snapdub.ai/clips/a1b2c3d4.jpg',
      },
      {
        clip_id: 'e5f6a7b8',
        title: 'What nobody tells you about discipline',
        virality_score: 88,
        description: 'Motivation fades. Systems stay.',
        hashtags: '#discipline #habits',
        duration_seconds: 57.5,
        download_url: 'https://cdn.snapdub.ai/clips/e5f6a7b8.mp4',
        thumbnail_url: 'https://cdn.snapdub.ai/clips/e5f6a7b8.jpg',
      },
    ],
  },
  async onEnable(context) {
    const webhook = await snapdubWebhook.subscribe({
      apiKey: context.auth.secret_text,
      webhookUrl: context.webhookUrl,
      event: 'video.completed',
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
      event: 'video.completed',
      secret: webhook?.secret,
    });
  },
  async test(context) {
    const apiKey = context.auth.secret_text;
    const { videos } = await snapdubClient.call<{ videos?: SnapDubVideo[] }>({
      apiKey,
      method: HttpMethod.GET,
      path: '/videos',
    });
    const done = (videos ?? [])
      .filter((video) => video.status === 'done')
      .slice(0, TEST_LIMIT);
    return Promise.all(
      done.map(async (video) => {
        const withClips = await snapdubClient.call<SnapDubVideoWithClips>({
          apiKey,
          method: HttpMethod.GET,
          path: `/videos/${encodeURIComponent(video.video_id)}/clips`,
        });
        return { event: 'video.completed', ...withClips };
      })
    );
  },
});

const TEST_LIMIT = 3;
