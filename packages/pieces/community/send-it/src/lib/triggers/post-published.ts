import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../auth';
import { sendItRequest } from '../common';

type PublishedPayload = {
  deliveryId?: string;
  event?: string;
  timestamp?: string;
  data?: {
    platform?: string;
    postId?: string;
    postUrl?: string;
    content?: { text?: string };
    publishedAt?: string;
  };
};

export const postPublished = createTrigger({
  auth: sendItAuth,
  name: 'post_published',
  displayName: 'Post Published',
  description: 'Triggers when a post is successfully published to a platform',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = (await sendItRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/webhooks',
      {
        url: context.webhookUrl,
        events: ['post.published'],
      }
    )) as { webhook: { id: string; secret: string } };

    await context.store.put('webhookId', response.webhook.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhookId');
    if (webhookId) {
      await sendItRequest(
        context.auth.secret_text,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
    }
  },
  async run(context) {
    const payload = context.payload.body as PublishedPayload;
    return [
      {
        delivery_id: payload.deliveryId ?? null,
        event: payload.event ?? null,
        timestamp: payload.timestamp ?? null,
        platform: payload.data?.platform ?? null,
        post_id: payload.data?.postId ?? null,
        post_url: payload.data?.postUrl ?? null,
        content_text: payload.data?.content?.text ?? null,
        published_at: payload.data?.publishedAt ?? null,
      },
    ];
  },
  sampleData: {
    delivery_id: 'dlv_sample123',
    event: 'post.published',
    timestamp: '2025-01-14T12:00:00.000Z',
    platform: 'linkedin',
    post_id: 'urn:li:share:1234567890',
    post_url: 'https://www.linkedin.com/feed/update/urn:li:share:1234567890',
    content_text: 'Sample post content',
    published_at: '2025-01-14T12:00:00.000Z',
  },
});
