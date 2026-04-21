import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedhiveAuth } from '../common/auth';
import { feedhiveCommon } from '../common';

export const commentNotificationTrigger = createTrigger({
  auth: feedhiveAuth,
  name: 'comment_notification',
  displayName: 'Comment Notification',
  description: 'Triggers when a comment is added to one of your posts.',
  props: {
    instructions: Property.MarkDown({
      value: `### Setup Instructions

1. Enable this flow and copy the **Webhook URL** shown below.
2. In FeedHive, go to **Settings → Automation → Notifications**.
3. Click **Create New Notification**.
4. Choose **Comment Added** and paste the Webhook URL, then click **Save**.`,
    }),
  },
  sampleData: {
    post_id: 'xxxx-abcd-1234',
    comment_id: 'yyyy-zxyw-4321',
    commented_at: '2024-08-01T12:00:00.000Z',
    commented_by: 'zzzz-efgh-5678',
    commented_by_name: 'John Doe',
    commented_by_email: 'johndoe@gmail.com',
    comment_text: 'Great post. Perhaps add another image?',
    post_excerpt: 'This is the first part of the post caption...',
    post: {
      content: [{ text: 'Full post caption.', media: [] }],
      labels: ['Marketing'],
      postNotes: 'Internal notes',
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(_context) {
    // Webhook URL must be configured manually in FeedHive: Settings → Automation → Notifications
  },

  async onDisable(_context) {
    // Nothing to unregister
  },

  async run(context) {
    return [context.payload.body];
  },

  async test(context) {
    // No dedicated comments endpoint — fetch recent published posts and approximate the payload shape
    const response = await feedhiveCommon.apiCall<{
      data: { items: Record<string, unknown>[] };
    }>({
      token: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: '/posts',
      queryParams: { limit: '5', status: 'published' },
    });

    const posts = response.body.data?.items ?? [];

    return posts.map((post) => {
      const postExcerpt =
        typeof post['text'] === 'string'
          ? post['text'].slice(0, 100) + (post['text'].length > 100 ? '...' : '')
          : '(no text)';

      return {
        post_id: post['id'] ?? null,
        comment_id: null,
        commented_at: null,
        commented_by: null,
        commented_by_name: '(see FeedHive notification)',
        commented_by_email: '(see FeedHive notification)',
        comment_text: '(see FeedHive notification)',
        post_excerpt: postExcerpt,
        post: {
          content: [{ text: post['text'] ?? '', media: post['media'] ?? [] }],
          labels: post['labels'] ?? [],
          postNotes: post['notes'] ?? '',
        },
      };
    });
  },
});
