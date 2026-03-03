import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdown = `
Activepieces Platform API is available under the Platform Edition.
(https://www.activepieces.com/docs/admin-console/overview)

**Note**: The API Key is available in the Platform Dashboard.

`;

export const activePieceAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    baseApiUrl: Property.ShortText({
      displayName: 'Base URL',
      required: true,
      defaultValue: 'https://cloud.activepieces.com/api/v1',
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
});
