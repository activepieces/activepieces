import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedhiveAuth } from '../common/auth';
import { feedhiveCommon } from '../common';

const EVENT_TYPE_STATUS_MAP: Record<string, string> = {
  post_published: 'published',
  post_scheduled: 'scheduled',
  post_failed: 'failed',
};

export const postNotificationTrigger = createTrigger({
  auth: feedhiveAuth,
  name: 'post_notification',
  displayName: 'Post Notification',
  description: 'Triggers when a post is published, scheduled, or fails.',
  props: {
    event_type: Property.StaticDropdown({
      displayName: 'Event Type',
      description:
        'Choose the event type you will configure in FeedHive. This is used to load sample data when testing the trigger — it does not filter incoming webhooks.',
      required: true,
      defaultValue: 'post_published',
      options: {
        options: [
          { label: 'Post Published', value: 'post_published' },
          { label: 'Post Scheduled', value: 'post_scheduled' },
          { label: 'Post Failed', value: 'post_failed' },
        ],
      },
    }),
    instructions: Property.MarkDown({
      value: `### Setup Instructions

1. Enable this flow and copy the **Webhook URL** shown below.
2. In FeedHive, go to **Settings → Automation → Notifications**.
3. Click **Create New Notification**.
4. Choose the matching event type and paste the Webhook URL, then click **Save**.`,
    }),
  },
  sampleData: {
    post_id: 'xxxx-abcd-1234',
    post_excerpt: 'This is the first part of the post caption...',
    social_type: 'Facebook',
    social_name: 'My Facebook Page',
    public_id: '123456789101112_1314151617181920',
    public_url: 'https://www.facebook.com/xxxx/posts/yyyy',
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
    const eventType = context.propsValue.event_type ?? 'post_published';
    const status = EVENT_TYPE_STATUS_MAP[eventType] ?? 'published';

    const response = await feedhiveCommon.apiCall<{
      data: { items: Record<string, unknown>[] };
    }>({
      token: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: '/posts',
      queryParams: { limit: '5', status },
    });

    const posts = response.body.data?.items ?? [];

    return posts.map((post) => buildSamplePayload(eventType, post));
  },
});

function buildSamplePayload(
  eventType: string,
  post: Record<string, unknown>,
): Record<string, unknown> {
  const postExcerpt =
    typeof post['text'] === 'string'
      ? post['text'].slice(0, 100) + (post['text'].length > 100 ? '...' : '')
      : '(no text)';

  const notificationPost = {
    content: [{ text: post['text'] ?? '', media: post['media'] ?? [] }],
    labels: post['labels'] ?? [],
    postNotes: post['notes'] ?? '',
  };

  const base = {
    post_id: post['id'] ?? null,
    post_excerpt: postExcerpt,
    post: notificationPost,
  };

  switch (eventType) {
    case 'post_published':
      return {
        ...base,
        social_type: '(see FeedHive notification)',
        social_name: '(see FeedHive notification)',
        public_id: null,
        public_url: null,
      };
    case 'post_scheduled':
      return {
        ...base,
        schedule_at: post['scheduled_at'] ?? null,
        pending_approval: false,
        social_types: '(see FeedHive notification)',
      };
    case 'post_failed':
      return {
        ...base,
        failed_at: post['updated_at'] ?? null,
        message: '(see FeedHive notification)',
        social_type: '(see FeedHive notification)',
        social_name: '(see FeedHive notification)',
      };
    default:
      return base;
  }
}
