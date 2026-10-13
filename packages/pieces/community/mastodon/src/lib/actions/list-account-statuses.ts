import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { statusPageOutputSchema } from '../output-schemas';

export const listAccountStatuses = createAction({
  auth: mastodonAuth,
  name: 'list_account_statuses',
  classification: 'SEARCH',
  displayName: 'List Account Statuses',
  description: 'List the statuses posted by an account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of statuses posted or boosted by an account, newest first, with cursors for further pages; filter to media, pinned posts, a hashtag, or exclude replies and boosts. For your own posts, get your account ID from Get My Account. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: statusPageOutputSchema,
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description:
        'Local ID of the account. Obtain it from Get My Account, Lookup Account, Search Accounts or Search (use resolve for a remote user@domain).',
      required: true,
    }),
    only_media: Property.Checkbox({
      displayName: 'Only Statuses With Media',
      required: false,
      defaultValue: false,
    }),
    exclude_replies: Property.Checkbox({
      displayName: 'Exclude Replies',
      required: false,
      defaultValue: false,
    }),
    exclude_reblogs: Property.Checkbox({
      displayName: 'Exclude Boosts',
      required: false,
      defaultValue: false,
    }),
    pinned: Property.Checkbox({
      displayName: 'Only Pinned Statuses',
      required: false,
      defaultValue: false,
    }),
    tagged: Property.ShortText({
      displayName: 'Hashtag Filter',
      description: 'Only statuses using this hashtag, without the # sign, for example mastodon.',
      required: false,
    }),
    limit: mastodonProps.limit({ noun: 'statuses', defaultLimit: 20, maxLimit: 40 }),
    max_id: mastodonProps.maxId(),
    since_id: mastodonProps.sinceId(),
    min_id: mastodonProps.minId(),
  },
  async run(context) {
    const props = context.propsValue;
    const { items, ...cursors } = await mastodonClient.requestPage<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/api/v1/accounts/${encodeURIComponent(props.account_id)}/statuses`,
      operation: 'List Account Statuses',
      scope: 'read:statuses',
      query: {
        only_media: props.only_media === true ? true : undefined,
        exclude_replies: props.exclude_replies === true ? true : undefined,
        exclude_reblogs: props.exclude_reblogs === true ? true : undefined,
        pinned: props.pinned === true ? true : undefined,
        tagged: props.tagged?.replace(/^#/, ''),
        limit: props.limit,
        max_id: props.max_id,
        since_id: props.since_id,
        min_id: props.min_id,
      },
    });
    return { statuses: items, ...cursors };
  },
});
