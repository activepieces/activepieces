import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../../index';
import { sendItRequest } from '../common';

export const postScheduled = createTrigger({
  auth: sendItAuth,
  name: 'post_scheduled',
  displayName: 'Post Scheduled',
  description: 'Triggers when a post is scheduled',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await sendItRequest(
      context.auth,
      HttpMethod.POST,
      '/webhooks',
      {
        url: context.webhookUrl,
        events: ['post.scheduled'],
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
    deliveryId: 'dlv_sample456',
    event: 'post.scheduled',
    timestamp: '2025-01-14T12:00:00.000Z',
    data: {
      scheduleId: 'sch_abc123',
      platforms: ['linkedin', 'instagram'],
      content: {
        text: 'Scheduled post content',
      },
      scheduledTime: '2025-01-15T12:00:00.000Z',
    },
  },
});
