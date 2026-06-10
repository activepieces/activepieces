import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../auth';
import { sendItRequest } from '../common';

type ScheduledPayload = {
  deliveryId?: string;
  event?: string;
  timestamp?: string;
  data?: {
    scheduleId?: string;
    platforms?: string[];
    content?: { text?: string };
    scheduledTime?: string;
  };
};

export const postScheduled = createTrigger({
  auth: sendItAuth,
  name: 'post_scheduled',
  displayName: 'Post Scheduled',
  description: 'Triggers when a post is scheduled for future publishing',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = (await sendItRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/webhooks',
      {
        url: context.webhookUrl,
        events: ['post.scheduled'],
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
    const payload = context.payload.body as ScheduledPayload;
    return [
      {
        delivery_id: payload.deliveryId ?? null,
        event: payload.event ?? null,
        timestamp: payload.timestamp ?? null,
        schedule_id: payload.data?.scheduleId ?? null,
        platforms: Array.isArray(payload.data?.platforms)
          ? payload.data.platforms.join(', ')
          : null,
        content_text: payload.data?.content?.text ?? null,
        scheduled_time: payload.data?.scheduledTime ?? null,
      },
    ];
  },
  sampleData: {
    delivery_id: 'dlv_sample456',
    event: 'post.scheduled',
    timestamp: '2025-01-14T12:00:00.000Z',
    schedule_id: 'sch_abc123',
    platforms: 'linkedin, instagram',
    content_text: 'Scheduled post content',
    scheduled_time: '2025-01-15T12:00:00.000Z',
  },
});
