import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { accountOutputSchema } from '../output-schemas';

export const getAccount = createAction({
  auth: mastodonAuth,
  name: 'get_account',
  classification: 'READ',
  displayName: 'Get Account',
  description: 'Get a Mastodon account profile by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches an account profile by its local ID. If you only have a handle, use Lookup Account (known accounts) or Search with resolve (remote accounts) to get the ID first. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: accountOutputSchema,
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description:
        'Local ID of the account on this server, for example 109302436954721982. Obtain it from Lookup Account, Search Accounts, Get Account or Search (use resolve for a remote user@domain).',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/api/v1/accounts/${encodeURIComponent(context.propsValue.account_id)}`,
      operation: 'Get Account',
      scope: 'read:accounts',
    });
  },
});
