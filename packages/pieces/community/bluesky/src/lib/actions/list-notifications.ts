import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { notificationListOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyMappers } from '../common/mappers';
import { blueskyCompose } from '../common/compose';

export const listNotifications = createAction({
  auth: blueskyAuth,
  name: 'list_notifications',
  classification: 'SEARCH',
  displayName: 'List Notifications',
  description: 'List your notifications (likes, reposts, follows, mentions, replies, quotes)',
  audience: 'both',
  outputSchema: notificationListOutputSchema,
  aiMetadata: {
    description:
      'Lists the connected account\'s notifications (likes, reposts, follows, mentions, replies, quotes and more), newest first, optionally filtered by type or to unread ones, with cursor pagination. Use Get Unread Count for only the number. Read-only and idempotent; it does not mark anything as seen.',
    idempotent: true,
  },
  props: {
    reasons: blueskyProps.notificationReasonsProperty({ description: 'Only these notification types. Leave empty for all.' }),
    unreadOnly: Property.Checkbox({
      displayName: 'Unread Only',
      description: 'Only return notifications that are not yet marked as seen. A page can then hold fewer items than the limit.',
      required: false,
      defaultValue: false,
    }),
    limit: blueskyProps.limitProperty(),
    cursor: blueskyProps.cursorProperty(),
  },
  async run({ auth, propsValue }) {
    const limit = blueskyProps.parseLimit(propsValue.limit);
    const cursor = blueskyProps.parseCursor(propsValue.cursor);
    const reasons = blueskyCompose.stringList(propsValue.reasons);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'list notifications',
      fn: async (agent) => {
        const response = await agent.listNotifications({ limit, cursor, ...(reasons.length > 0 ? { reasons } : {}) });
        const notifications = propsValue.unreadOnly === true ? response.data.notifications.filter((n) => !n.isRead) : response.data.notifications;
        return {
          ...blueskyMappers.pageOf({ items: notifications.map(blueskyMappers.notificationItem), cursor: response.data.cursor }),
          seenAt: response.data.seenAt ?? null,
        };
      },
    });
  },
});
