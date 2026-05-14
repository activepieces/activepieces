import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const pCloudAuth = PieceAuth.CustomAuth({
  description: `
    To authenticate with pCloud:
    1. Log in to your pCloud account.
    2. Go to the [pCloud API](https://docs.pcloud.com/) documentation.
    3. Generate an access token (auth) via the 'userinfo' method or OAuth2.
  `,
  required: true,
  props: {
    token: Property.SecretText({
      displayName: 'Access Token',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      required: true,
      defaultValue: 'https://api.pcloud.com',
      options: {
        options: [
          { label: 'United States (api.pcloud.com)', value: 'https://api.pcloud.com' },
          { label: 'Europe (eapi.pcloud.com)', value: 'https://eapi.pcloud.com' },
        ],
      },
    }),
  },
});
