import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { makeClient } from '../../../common';
import { listNotificationsActionOutputSchema } from '../../../output-schemas';

export const listNotificationsAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_notifications',
  classification: 'SEARCH',
  displayName: 'List My Notifications',
  description: 'Lists the connected user\'s monday.com notifications.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the bell notifications of the monday.com user who owns the API token, newest first, with the linked board, item and update IDs; optionally only unread ones or since a date. Use to see what needs the user\'s attention. Page with the last notification ID as the cursor. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listNotificationsActionOutputSchema,
  props: {
    unread_only: Property.Checkbox({
      displayName: 'Unread Only',
      required: false,
      defaultValue: false,
    }),
    since: Property.DateTime({
      displayName: 'Since',
      description: 'Only return notifications from this date and time (inclusive).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of notifications to return (default 25).',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'The ID of the last notification from the previous page.',
      required: false,
    }),
  },
  async run(context) {
    const { unread_only, since, limit, cursor } = context.propsValue;

    const data = await makeClient(context.auth).query<{ notifications: MondayNotification[] | null }>({
      query: `query ($filterRead: Boolean, $since: ISO8601DateTime, $limit: Int, $cursor: ID) {
        notifications(filter_read: $filterRead, since: $since, limit: $limit, cursor: $cursor) {
          id
          title
          text
          read
          created_at
          board { id name }
          item { id name }
          update { id }
        }
      }`,
      variables: {
        filterRead: unread_only ? true : undefined,
        since: since || undefined,
        limit: limit ?? undefined,
        cursor: cursor || undefined,
      },
    });

    const notifications = (data.notifications ?? []).map((n) => ({
      id: n.id,
      title: n.title ?? null,
      text: n.text ?? null,
      read: n.read,
      created_at: n.created_at ?? null,
      board_id: n.board?.id ?? null,
      board_name: n.board?.name ?? null,
      item_id: n.item?.id ?? null,
      item_name: n.item?.name ?? null,
      update_id: n.update?.id ?? null,
    }));

    return {
      notifications,
      count: notifications.length,
      next_cursor: notifications.length > 0 ? notifications[notifications.length - 1].id : null,
    };
  },
});

type MondayNotification = {
  id: string;
  title: string | null;
  text: string | null;
  read: boolean;
  created_at: string | null;
  board: { id: string; name: string } | null;
  item: { id: string; name: string } | null;
  update: { id: string } | null;
};
