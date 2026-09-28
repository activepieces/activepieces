import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonUtils } from '../common/client';
import { relationshipsOutputSchema } from '../output-schemas';

export const getRelationships = createAction({
  auth: mastodonAuth,
  name: 'get_relationships',
  classification: 'READ',
  displayName: 'Get Relationships',
  description: 'Check how the connected account relates to other accounts.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the connected account\'s relationship with each given account: following, followed by, requested, blocking, muting and more. Use it to check state before Follow Account, Block Account or Mute Account. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: relationshipsOutputSchema,
  props: {
    account_ids: Property.Array({
      displayName: 'Account IDs',
      description:
        'Local account IDs to check, one per item. Obtain them from Lookup Account, Search Accounts or Get Account.',
      required: true,
    }),
  },
  async run(context) {
    const accountIds = mastodonUtils.toStringArray(context.propsValue.account_ids);
    if (accountIds === undefined) {
      throw new Error('Provide at least one Account ID.');
    }
    const relationships = await mastodonClient.request<MastodonEntity[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/accounts/relationships',
      operation: 'Get Relationships',
      scope: 'read:follows',
      query: { id: accountIds },
    });
    return { relationships, count: relationships.length };
  },
});
