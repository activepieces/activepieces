import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';

const URL_PATTERN = /^https?:\/\//i;
const HANDLE_PATTERN = /^@?[^@\s]+@[^@\s]+\.[^@\s]+$/;
import { searchOutputSchema } from '../output-schemas';

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
      description:
        'Search text, a hashtag, a handle such as Gargron@mastodon.social, or a status or profile URL such as https://mastodon.social/@Gargron/109372843234737004.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Result Type',
      description: 'Only return one kind of result. Leave empty for all three.',
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
      description:
        'Fetch unknown remote accounts or URLs from their server. Leave empty to resolve automatically when the query is a URL or user@domain handle.',
    }),
    following: mastodonProps.optionalBoolean({
      displayName: 'Only Accounts I Follow',
      description: 'Only include accounts the connected account follows. Leave empty for no restriction.',
    }),
    account_id: Property.ShortText({
      displayName: 'Statuses By Account ID',
      description:
        'Only return statuses written by this account. Use the Account ID from Lookup Account, not the @handle.',
      required: false,
    }),
    exclude_unreviewed: mastodonProps.optionalBoolean({
      displayName: 'Exclude Unreviewed Hashtags',
      description: 'Leave out hashtags not yet reviewed by moderators. Leave empty for the default (no).',
    }),
    limit: mastodonProps.limit({ noun: 'results per type', defaultLimit: 20, maxLimit: 40 }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of results to skip, for paging. Only applies when Result Type is set.',
      required: false,
    }),
    max_id: Property.ShortText({
      displayName: 'Max ID',
      description: 'Only return results with an ID lower than this.',
      required: false,
    }),
    min_id: Property.ShortText({
      displayName: 'Min ID',
      description: 'Only return results with an ID immediately higher than this.',
      required: false,
    }),
  },
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
