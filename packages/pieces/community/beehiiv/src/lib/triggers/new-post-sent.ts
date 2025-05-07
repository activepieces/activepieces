import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BEEHIIV_API_URL, beehiivAuth, publicationIdProperty } from '../common';

export const newPostSent = createTrigger({
  name: 'new_post_sent',
  displayName: 'New Post Sent',
  description: 'Triggers when a new post is published',
  type: TriggerStrategy.WEBHOOK,
  auth: beehiivAuth,
  props: {
    publication_id: publicationIdProperty,
  },
  async onEnable(context) {
    const { publication_id } = context.propsValue;
    const webhookUrl = context.webhookUrl;

    // Register webhook with beehiiv
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BEEHIIV_API_URL}/publications/${publication_id}/webhooks`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        url: webhookUrl,
        event_types: ['post.sent'],
      },
    });

    // Store webhook ID for later deletion
    await context.store.put('webhook_id', response.body.data.id);
  },
  async onDisable(context) {
    const { publication_id } = context.propsValue;
    const webhookId = await context.store.get('webhook_id');

    if (webhookId) {
      // Delete webhook from beehiiv
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${BEEHIIV_API_URL}/publications/${publication_id}/webhooks/${webhookId}`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
        },
      });
    }
  },
  async run(context) {
    // The webhook payload from beehiiv
    const payload = context.payload.body as {
      event_type: string;
      data: unknown;
    };

    // Check if this is a post.sent event
    if (payload.event_type === 'post.sent') {
      return [payload.data];
    }

    return [];
  },
  sampleData: {
    "audience": "free",
    "authors": [
      "Clark Kent"
    ],
    "content_tags": [
      "news"
    ],
    "created": 1666800076,
    "id": "post_00000000-0000-0000-0000-000000000000",
    "preview_text": "More news on the horizon",
    "slug": "more_news",
    "split_tested": true,
    "status": "confirmed",
    "subject_line": "Check this out",
    "subtitle": "New post subtitle",
    "thumbnail_url": "https://example.com/pictures/thumbnail.png",
    "title": "New Post Title",
    "displayed_date": 1666800076,
    "web_url": "https://example.com/more_news"
  },
});
