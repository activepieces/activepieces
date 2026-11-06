import { AppConnectionType, PieceAuth, Property, tryCatch } from '@activepieces/pieces-framework';

import { confluenceApi } from './common/api';

export const confluenceAuth = PieceAuth.CustomAuth({
  description: 'Please refer to this guide to get your api credentials: https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account',
  required: true,
  props: {
    username: Property.ShortText({
      displayName: 'Account Email',
      required: true,
      description: 'Account email for basic auth',
    }),
    password: PieceAuth.SecretText({
      displayName: 'API token',
      required: true,
      description: 'API token for basic auth',
    }),
    confluenceDomain: Property.ShortText({
      displayName: 'Confluence Domain',
      required: true,
      description: 'Example value - https://your-domain.atlassian.net (without trailing slash)',
    }),
  },
  validate: async ({ auth }) => {
    const { data, error } = await tryCatch(() =>
      confluenceApi.getCurrentUser({ auth: { type: AppConnectionType.CUSTOM_AUTH, props: auth } }),
    );
    if (error || data?.type !== 'known') {
      return {
        valid: false,
        error: 'Could not connect to Confluence. Check the account email, API token and Confluence domain (e.g. https://your-domain.atlassian.net).',
      };
    }
    return { valid: true };
  },
});
