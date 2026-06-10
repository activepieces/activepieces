import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendItAuth } from '../auth';
import { sendItRequest } from '../common';

type FailedPayload = {
  deliveryId?: string;
  event?: string;
  timestamp?: string;
  data?: {
    platform?: string;
    content?: { text?: string };
    error?: string;
    failedAt?: string;
  };
};

export const postFailed = createTrigger({
  auth: sendItAuth,
  name: 'post_failed',
  displayName: 'Post Failed',
  description: 'Triggers when a post fails to publish to a platform',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = (await sendItRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/webhooks',
      {
        url: context.webhookUrl,
        events: ['post.failed'],
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
    const payload = context.payload.body as FailedPayload;
    return [
      {
        delivery_id: payload.deliveryId ?? null,
        event: payload.event ?? null,
        timestamp: payload.timestamp ?? null,
        platform: payload.data?.platform ?? null,
        content_text: payload.data?.content?.text ?? null,
        error: payload.data?.error ?? null,
        failed_at: payload.data?.failedAt ?? null,
      },
    ];
  },
  sampleData: {
    delivery_id: 'dlv_sample789',
    event: 'post.failed',
    timestamp: '2025-01-14T12:00:00.000Z',
    platform: 'instagram',
    content_text: 'Failed post content',
    error: 'Instagram API rate limit exceeded',
    failed_at: '2025-01-14T12:00:00.000Z',
  },
});
