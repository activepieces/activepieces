import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { relationshipOutputSchema } from '../output-schemas';

export const unfollowAccount = createAction({
  auth: mastodonAuth,
  name: 'unfollow_account',
  classification: 'WRITE',
  displayName: 'Unfollow Account',
  description: 'Stop following an account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Unfollows an account (or withdraws a pending follow request) as the connected account. Safe to retry. Returns the updated relationship.',
    idempotent: true,
  },
  outputSchema: relationshipOutputSchema,
  props: {
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description:
        'ID of the account to unfollow, for example 109302436954721982 (not the @handle). Map it from Lookup Account (Account ID), Search Accounts, Get Account or Search for a user@domain on another server.',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/api/v1/accounts/${encodeURIComponent(context.propsValue.account_id)}/unfollow`,
      operation: 'Unfollow Account',
      scope: 'write:follows',
    });
  },
});
