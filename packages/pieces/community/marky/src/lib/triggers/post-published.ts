import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

import { markyAuth } from '../auth';
import { markyClient } from '../common/client';

const WEBHOOK_ID_KEY = 'marky-post-published-webhook-id';

const postPublishedTrigger = createTrigger({
  auth: markyAuth,
  name: 'post-published',
  displayName: 'Post Published',
  description:
    'Fires when a Marky post is published to any platform. The webhook is org-scoped and covers all businesses in the organization.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const result = await markyClient.registerWebhook({
      apiKey: context.auth.secret_text,
      url: context.webhookUrl,
      events: ['post.published'],
    });

    if (!result.ok) {
      throw new Error(`Failed to register webhook: ${result.message}`);
    }

    await context.store.put<string>(WEBHOOK_ID_KEY, result.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>(WEBHOOK_ID_KEY);
    if (!isNil(webhookId)) {
      await markyClient.deleteWebhook({
        apiKey: context.auth.secret_text,
        webhookId,
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    id: '00000000-0000-0000-0000-000000000000',
    business_id: '00000000-0000-0000-0000-000000000000',
    caption: 'Our new product is live! Check it out.',
    status: 'PUBLISHED',
    media_urls: ['https://example.com/image.png'],
    publish_to: ['instagram', 'linkedin'],
    adhoc_publish_time: null,
    published_at: '2024-01-15T10:00:00Z',
    created_at: '2024-01-14T09:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
});

export { postPublishedTrigger };
