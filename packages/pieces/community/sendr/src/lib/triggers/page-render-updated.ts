import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sendrApiCall } from '../common';

export const pageRenderUpdated = createTrigger({
  auth: sendrAuth,
  name: 'page_render_updated',
  displayName: 'Page Render Updated',
  description: 'Triggers when a Sendr Page render is updated (e.g. GIF or audio is ready).',
  props: {},
  sampleData: {
    event_type: 'page_render:updated',
    page_id: 'cuid_example',
    page_url: 'https://pages.sendr.io/example',
    page_slug: 'example-slug',
    gif_url: 'https://cdn.sendr.io/gif/example.gif',
    audio_url: 'https://cdn.sendr.io/audio/example.mp3',
    lipsync_video: 'https://cdn.sendr.io/video/example.mp4',
    event_status: 'updated',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    try {
      await sendrApiCall({
        token: context.auth as unknown as string,
        method: HttpMethod.POST,
        path: '/webhook',
        body: {
          name: 'Activepieces - Page Render Updated',
          url: context.webhookUrl,
          events: ['page_render:updated'],
        },
      });
      await context.store.put('webhookUrl', context.webhookUrl);
    } catch (e) {
      throw new Error('Failed to register Sendr webhook: ' + (e as Error).message);
    }
  },

  async onDisable(context) {
    try {
      const webhookUrl = await context.store.get<string>('webhookUrl');
      if (webhookUrl) {
        await sendrApiCall({
          token: context.auth as unknown as string,
          method: HttpMethod.DELETE,
          path: '/webhook',
          body: { url: webhookUrl },
        });
      }
    } catch (e) {
      throw new Error('Failed to unregister Sendr webhook: ' + (e as Error).message);
    }
    await context.store.delete('webhookUrl');
  },

  async run(context) {
    const body = context.payload.body as Record<string, unknown>;
    return [{
      event_type: body.event ?? 'page_render:updated',
      page_id: body.pageId ?? null,
      page_url: body.pageUrl ?? null,
      page_slug: body.pageSlug ?? null,
      gif_url: body.gifUrl ?? null,
      audio_url: body.audioUrl ?? null,
      lipsync_video: body.lipsyncVideo ?? null,
      event_status: body.eventStatus ?? null,
    }];
  },

  async test(context) {
    return [
      {
        event_type: 'page_render:updated',
        page_id: 'test_cuid_page',
        page_url: 'https://pages.sendr.io/test',
        page_slug: 'test-slug',
        gif_url: 'https://cdn.sendr.io/gif/test.gif',
        audio_url: 'https://cdn.sendr.io/audio/test.mp3',
        lipsync_video: 'https://cdn.sendr.io/video/test.mp4',
        event_status: 'updated',
      },
    ];
  },
});
