import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../../index';
import { sendItRequest } from '../common';

export const postFailed = createTrigger({
  auth: sendItAuth,
  name: 'post_failed',
  displayName: 'Post Failed',
  description: 'Triggers when a post fails to publish',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await sendItRequest(
      context.auth,
      HttpMethod.POST,
      '/webhooks',
      {
        url: context.webhookUrl,
        events: ['post.failed'],
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
    deliveryId: 'dlv_sample789',
    event: 'post.failed',
    timestamp: '2025-01-14T12:00:00.000Z',
    data: {
      platform: 'instagram',
      content: {
        text: 'Failed post content',
      },
      error: 'Instagram API rate limit exceeded',
      failedAt: '2025-01-14T12:00:00.000Z',
    },
  },
});
