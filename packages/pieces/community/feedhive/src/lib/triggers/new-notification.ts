import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { feedhiveAuth } from '../common/auth';

export const newNotificationTrigger = createTrigger({
  auth: feedhiveAuth,
  name: 'new_notification',
  displayName: 'New Notification',
  description: 'Triggers when FeedHive sends a notification (post published, scheduled, failed, or comment added).',
  props: {
    instructions: Property.MarkDown({
      value: `### Setup Instructions

1. Enable this flow and copy the **Webhook URL** shown below.
2. In FeedHive, go to **Settings → Automation → Notifications**.
3. Click **Create New Notification**.
4. Choose the event type you want to listen to (Published, Scheduled, Failed, or Comment Added).
5. Paste the Webhook URL and click **Save**.

To listen to multiple event types, create one FeedHive notification per event type, each pointing to this same URL — or create a separate flow per event type.`,
    }),
  },
  sampleData: {
    post_id: 'xxxx-abcd-1234',
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
});
