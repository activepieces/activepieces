import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { accountOutputSchema } from '../output-schemas';

export const lookupAccount = createAction({
  auth: mastodonAuth,
  name: 'lookup_account',
  classification: 'READ',
  displayName: 'Lookup Account',
  description:
    'Find an account by its handle (username or user@domain) to get its Account ID for Follow Account and other steps.',
  audience: 'both',
  aiMetadata: {
    description:
      'Resolves a handle such as Gargron or Gargron@mastodon.social to the account profile and local ID, without a fuzzy search. Only finds accounts already known to this server; for a remote user@domain that 404s, use Search with resolve=true (type accounts). Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: accountOutputSchema,
  props: {
    acct: Property.ShortText({
      displayName: 'Handle',
      description:
        'Username for a local account (for example Gargron) or user@domain for a remote one (for example Gargron@mastodon.social). A leading @ is removed automatically.',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/accounts/lookup',
      operation: 'Lookup Account',
      scope: 'read:accounts',
      notFoundMessage:
        'Mastodon found no account with this handle. Lookup Account only finds accounts already known to this server; for a remote user@domain, use Search with resolve=true (type accounts) to import it and get its local ID.',
      query: { acct: context.propsValue.acct.trim().replace(/^@/, '') },
    });
  },
});
