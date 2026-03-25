import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const confluenceAuth = PieceAuth.CustomAuth({
  description: 'Please refer to this guide to get your api credentials: https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account',
  required: true,
  props: {
    username: PieceAuth.SecretText({
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
      description: 'Example value - https://your-domain.atlassian.net',
    }),
  },
});
