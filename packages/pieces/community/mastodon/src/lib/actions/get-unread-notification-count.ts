import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonClient, mastodonProps } from '../common/client';
import { unreadNotificationCountOutputSchema } from '../output-schemas';

export const getUnreadNotificationCount = createAction({
  auth: mastodonAuth,
  name: 'get_unread_notification_count',
  classification: 'READ',
  displayName: 'Get Unread Notification Count',
  description: 'Get the number of unread notifications.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns how many unread notifications the connected account has (capped by Limit), optionally counting only some types or one account. Use List Notifications to read them. Requires Mastodon 4.3 or later. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: unreadNotificationCountOutputSchema,
  props: {
    types: mastodonProps.notificationTypes({
      displayName: 'Count Only Types',
      description: 'Only count these notification types. Leave empty for all types.',
    }),
    exclude_types: mastodonProps.notificationTypes({
      displayName: 'Exclude Types',
      description: 'Do not count these notification types.',
    }),
    account_id: Property.ShortText({
      displayName: 'From Account ID',
      description: 'Only count notifications caused by this account (local account ID).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Maximum Count',
      description: 'Stop counting at this number. Defaults to 100, maximum 1000.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    return mastodonClient.request<UnreadCount>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/notifications/unread_count',
      operation: 'Get Unread Notification Count',
      scope: 'read:notifications',
      minVersion: '4.3.0',
      query: {
        types: props.types !== undefined && props.types.length > 0 ? props.types : undefined,
        exclude_types:
          props.exclude_types !== undefined && props.exclude_types.length > 0
            ? props.exclude_types
            : undefined,
        account_id: props.account_id,
        limit: props.limit,
      },
    });
  },
});

type UnreadCount = {
  count: number;
};
