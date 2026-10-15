import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { relationshipOutputSchema } from '../output-schemas';

export const unmuteAccount = createAction({
  auth: mastodonAuth,
  name: 'unmute_account',
  classification: 'WRITE',
  displayName: 'Unmute Account',
  description: 'Unmute an account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a mute on an account so its posts and notifications show again. Safe to retry. Returns the updated relationship.',
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
      path: `/api/v1/accounts/${encodeURIComponent(context.propsValue.account_id)}/unmute`,
      operation: 'Unmute Account',
      scope: 'write:mutes',
    });
  },
});
