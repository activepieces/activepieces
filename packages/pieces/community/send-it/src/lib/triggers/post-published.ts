import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../../index';
import { sendItRequest } from '../common';

export const postPublished = createTrigger({
  auth: sendItAuth,
  name: 'post_published',
  displayName: 'Post Published',
  description: 'Triggers when a post is successfully published',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await sendItRequest(
      context.auth,
      HttpMethod.POST,
      '/webhooks',
      {
        url: context.webhookUrl,
        events: ['post.published'],
      }
    ) as { webhook: { id: string; secret: string } };

    await context.store.put('webhookId', response.webhook.id);
    await context.store.put('webhookSecret', response.webhook.secret);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhookId');
    if (webhookId) {
      await sendItRequest(
        context.auth,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    deliveryId: 'dlv_sample123',
    event: 'post.published',
    timestamp: '2025-01-14T12:00:00.000Z',
    data: {
      platform: 'linkedin',
      postId: 'urn:li:share:1234567890',
      postUrl: 'https://www.linkedin.com/feed/update/urn:li:share:1234567890',
      content: {
        text: 'Sample post content',
      },
      publishedAt: '2025-01-14T12:00:00.000Z',
    },
  },
});
