import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { notificationPageOutputSchema } from '../output-schemas';

export const listNotifications = createAction({
  auth: mastodonAuth,
  name: 'list_notifications',
  classification: 'SEARCH',
  displayName: 'List Notifications',
  description: 'List notifications of the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of the connected account\'s notifications (mentions, follows, favourites, boosts, polls and more), newest first, with cursors for further pages; filter by type or by the account that caused them. Use Get Unread Notification Count for just a number. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: notificationPageOutputSchema,
  props: {
    types: mastodonProps.notificationTypes({
      displayName: 'Include Types',
      description: 'Only return these notification types. Leave empty for all types.',
    }),
    exclude_types: mastodonProps.notificationTypes({
      displayName: 'Exclude Types',
      description: 'Leave out these notification types.',
    }),
    account_id: Property.ShortText({
      displayName: 'From Account ID',
      description:
        'Only notifications caused by this account (local ID from Lookup Account or Search Accounts).',
      required: false,
    }),
    limit: mastodonProps.limit({ noun: 'notifications', defaultLimit: 40, maxLimit: 80 }),
    max_id: mastodonProps.maxId(),
    since_id: mastodonProps.sinceId(),
    min_id: mastodonProps.minId(),
  },
  async run(context) {
    const props = context.propsValue;
    const { items, ...cursors } = await mastodonClient.requestPage<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/notifications',
      operation: 'List Notifications',
      scope: 'read:notifications',
      query: {
        types: nonEmpty({ values: props.types }),
        exclude_types: nonEmpty({ values: props.exclude_types }),
        account_id: props.account_id,
        limit: props.limit,
        max_id: props.max_id,
        since_id: props.since_id,
        min_id: props.min_id,
      },
    });
    return { notifications: items, ...cursors };
  },
});

function nonEmpty({ values }: { values: string[] | undefined }): string[] | undefined {
  return values === undefined || values.length === 0 ? undefined : values;
}
