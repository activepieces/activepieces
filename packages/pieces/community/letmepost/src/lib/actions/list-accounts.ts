import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { letmepostAuth } from '../common/auth';
import { letmepostApiCall } from '../common';

export const listAccounts = createAction({
  auth: letmepostAuth,
  name: 'list_accounts',
  displayName: 'List Accounts',
  description: 'List the social accounts connected to your organization',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every connected account, returning each id, platform, and display name. Use to discover which accounts are available and to resolve the account id required by Publish a Post. Idempotent, a read-only lookup.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await letmepostApiCall<{
      data: {
        id: string;
        platform: string;
        displayName: string | null;
        profileId: string;
        platformAccountId: string;
        tokenExpiresAt: string | null;
        createdAt: string;
      }[];
    }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/v1/accounts',
    });

    return response.body.data;
  },
});
