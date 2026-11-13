import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { searchOutputSchema } from '../output-schemas';

const URL_PATTERN = /^https?:\/\//i;
const HANDLE_PATTERN = /^@?[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const search = createAction({
  auth: mastodonAuth,
  name: 'search',
  classification: 'SEARCH',
  displayName: 'Search',
  description: 'Search for accounts, statuses and hashtags.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches accounts, statuses and hashtags on the connected server. It is also how to import remote content: a status URL or a user@domain handle with resolve=true fetches it from the other server and returns its local ID for other actions; resolve is turned on automatically for such queries unless you set it. Full-text status search depends on the server and may only match your own posts. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: searchOutputSchema,
  props: {
    q: Property.ShortText({
      displayName: 'Query',
      description: 'Text, a #hashtag, a user@domain handle or a status URL.',
      placeholder: 'Gargron@mastodon.social',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Result Type',
      description: 'Empty returns all three.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Accounts', value: 'accounts' },
          { label: 'Statuses', value: 'statuses' },
          { label: 'Hashtags', value: 'hashtags' },
        ],
      },
    }),
    resolve: mastodonProps.optionalBoolean({
      displayName: 'Resolve Remote Content',
      description: 'Fetch results from other servers. Empty: on for URLs and user@domain.',
      advanced: true,
    }),
    following: mastodonProps.optionalBoolean({
      displayName: 'Only Accounts I Follow',
      description: 'Limits account results to accounts you follow.',
    }),
    account_id: Property.ShortText({
      displayName: 'Statuses by Account ID',
      description: 'Only statuses written by this account.',
      placeholder: '109302436954721982',
      required: false,
    }),
    exclude_unreviewed: mastodonProps.optionalBoolean({
      displayName: 'Exclude Unreviewed Hashtags',
      description: 'Skip hashtags your server\'s moderators have not reviewed.',
      advanced: true,
    }),
    limit: mastodonProps.limit({ noun: 'results of each type', defaultLimit: 20, maxLimit: 40 }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Results to skip. Works only when Result Type is set.',
      required: false,
      advanced: true,
    }),
    max_id: Property.ShortText({
      displayName: 'Max ID',
      description: 'Only results older than this ID.',
      required: false,
      advanced: true,
    }),
    min_id: Property.ShortText({
      displayName: 'Min ID',
      description: 'Only results just newer than this ID.',
      required: false,
      advanced: true,
    }),
  },
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'text',
      props: ['q', 'type', 'account_id', 'following'],
    },
  ],
  async run(context) {
    const props = context.propsValue;
    const query = props.q.trim();
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v2/search',
      operation: 'Search',
      scope: 'read:search',
      query: {
        q: query,
        type: props.type,
        resolve: props.resolve ?? (shouldAutoResolve({ query }) ? true : undefined),
        following: props.following,
        account_id: props.account_id,
        exclude_unreviewed: props.exclude_unreviewed,
        limit: props.limit,
        offset: props.offset,
        max_id: props.max_id,
        min_id: props.min_id,
      },
    });
  },
});

function shouldAutoResolve({ query }: { query: string }): boolean {
  return URL_PATTERN.test(query) || HANDLE_PATTERN.test(query);
}
