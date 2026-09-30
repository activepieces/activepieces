import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { relationshipOutputSchema } from '../output-schemas';

export const blockAccount = createAction({
  auth: mastodonAuth,
  name: 'block_account',
  classification: 'DESTRUCTIVE',
  displayName: 'Block Account',
  description: 'Block an account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Blocks an account: it can no longer see or interact with the connected account, and any follow in either direction is removed (re-following is needed after an unblock). Use Mute Account to hide someone without them noticing. Safe to retry. Returns the updated relationship.',
    idempotent: true,
  },
  outputSchema: relationshipOutputSchema,
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
      method: HttpMethod.POST,
      path: `/api/v1/accounts/${encodeURIComponent(context.propsValue.account_id)}/block`,
      operation: 'Block Account',
      scope: 'write:blocks',
    });
  },
});
