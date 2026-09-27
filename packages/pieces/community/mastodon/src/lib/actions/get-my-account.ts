import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { myAccountOutputSchema } from '../output-schemas';

export const getMyAccount = createAction({
  auth: mastodonAuth,
  name: 'get_my_account',
  classification: 'READ',
  displayName: 'Get My Account',
  description: 'Get the profile of the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the connected account\'s own profile, including its ID, username, counts and default posting settings. Call it first to learn the account ID for actions like List Account Statuses. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: myAccountOutputSchema,
  props: {
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/accounts/verify_credentials',
      operation: 'Get My Account',
      scope: 'profile or read:accounts',
    });
  },
});
