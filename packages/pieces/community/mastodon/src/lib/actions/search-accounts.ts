import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { searchAccountsOutputSchema } from '../output-schemas';

export const searchAccounts = createAction({
  auth: mastodonAuth,
  name: 'search_accounts',
  classification: 'SEARCH',
  displayName: 'Search Accounts',
  description: 'Search for accounts by name or handle.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches accounts by display name, username or handle and returns matching profiles with their local IDs. Use Lookup Account for an exact handle, or Search to find statuses and hashtags too. Set Resolve to fetch an unknown remote user@domain via WebFinger. Page with Offset. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: searchAccountsOutputSchema,
  props: {
    q: Property.ShortText({
      displayName: 'Query',
      description: 'Text to search for, for example a name, username or user@domain.',
      required: true,
    }),
    limit: mastodonProps.limit({ noun: 'accounts', defaultLimit: 40, maxLimit: 80 }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of results to skip, for paging. Defaults to 0.',
      required: false,
    }),
    resolve: mastodonProps.optionalBoolean({
      displayName: 'Resolve Remote Accounts',
      description: 'Look up unknown remote accounts via WebFinger (slower). Leave empty for the server default (no).',
    }),
    following: mastodonProps.optionalBoolean({
      displayName: 'Only Accounts I Follow',
      description: 'Limit results to accounts the connected account follows. Leave empty for no restriction.',
    }),
  },
  async run(context) {
    const { q, limit, offset, resolve, following } = context.propsValue;
    const accounts = await mastodonClient.request<MastodonEntity[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/accounts/search',
      operation: 'Search Accounts',
      scope: 'read:accounts',
      query: { q, limit, offset, resolve, following },
    });
    return { accounts, count: accounts.length };
  },
});
