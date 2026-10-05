import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { unreadCountOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';

export const blueskyGetUnreadCount = createAction({
  auth: blueskyAuth,
  name: 'bluesky_get_unread_count',
  classification: 'READ',
  displayName: 'Get Unread Notification Count (AI)',
  description: 'Count unread notifications',
  audience: 'ai',
  outputSchema: unreadCountOutputSchema,
  aiMetadata: {
    description:
      'Returns how many notifications of the connected Bluesky account are unread. Use List Notifications to read them and Mark Notifications as Seen to reset the count. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'count unread notifications',
      fn: async (agent) => {
        const response = await agent.countUnreadNotifications();
        return { count: response.data.count, checkedAt: new Date().toISOString() };
      },
    });
  },
});
