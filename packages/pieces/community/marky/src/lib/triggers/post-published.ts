import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, isNil, TriggerStrategy } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { MarkyWebhook, markyCommon } from '../common/client';

export const postPublishedTrigger = createTrigger({
  auth: markyAuth,
  name: 'post_published',
  displayName: 'Post Published',
  description:
    'Fires when a Marky post is published to any platform. Marky webhooks cover the whole organization, so this fires for every business in it.',
  aiMetadata: {
    description:
      'Fires once per post when Marky publishes it to any connected platform, anywhere in the organization. The payload is the full post, including its business_id and per-platform publish results.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const response = await markyCommon.apiCall<MarkyWebhook>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/webhooks',
      body: {
        url: context.webhookUrl,
        events: ['post.published'],
      },
    });

    await context.store.put<string>(WEBHOOK_ID_STORE_KEY, response.body.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>(WEBHOOK_ID_STORE_KEY);
    if (isNil(webhookId)) {
      return;
    }

    await markyCommon.apiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/webhooks/${webhookId}`,
    });

    await context.store.delete(WEBHOOK_ID_STORE_KEY);
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    id: '5f1d7e0a-2f5a-4f7a-9d0e-2c3b4a5d6e7f',
    business_id: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    caption: 'Our new product is live! Check it out.',
    status: 'PUBLISHED',
    media_urls: ['https://cdn.mymarky.ai/media/example.png'],
    restrict_publish_to: ['instagram', 'linkedIn'],
    link: null,
    scheduled_publish_time: '2026-09-15T10:00:00Z',
    published_at: '2026-09-15T10:00:04Z',
    publish_results: [
      {
        platform: 'instagram',
        status: 'success',
        publish_id: '17912345678901234',
        post_url: 'https://www.instagram.com/p/Cxyz123abc/',
        error_type: null,
        error_message: null,
        integration_id: '9f8e7d6c-5b4a-4938-2716-0a1b2c3d4e5f',
        updated_at: '2026-09-15T10:00:04Z',
      },
    ],
    repeating_cron: null,
    created_at: '2026-09-14T09:00:00Z',
    updated_at: '2026-09-15T10:00:04Z',
    url: 'https://app.mymarky.ai/posts/5f1d7e0a-2f5a-4f7a-9d0e-2c3b4a5d6e7f',
  },
});

const WEBHOOK_ID_STORE_KEY = 'marky_post_published_webhook_id';
