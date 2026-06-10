import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdown = `
**Site ID:**\n

Please log in and go to Settings, click [here](https://fly.customer.io/settings/api_credentials).

**Tracking API Key:**\n

Please log in and go to Settings, click [here](https://fly.customer.io/settings/api_credentials).

**APP API Token:**\n

Please log in and find it in Account Settings, click [here](https://fly.customer.io/settings/api_credentials?keyType=app).

<br>
Please note that the Track API Key and App API Key are different. You can read more about it [here](https://customer.io/docs/accounts-and-workspaces/managing-credentials/).
`;

export const customerIOAuth = PieceAuth.CustomAuth({
  props: {
    region: Property.StaticDropdown<'us' | 'eu'>({
      displayName: 'Region',
      required: true,
      defaultValue: 'us',
      options: {
        options: [
          { label: 'US', value: 'us' },
          { label: 'EU', value: 'eu' },
        ],
      },
    }),
    track_site_id: Property.ShortText({
      displayName: 'Site ID',
      required: true,
    }),
    track_api_key: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
    api_bearer_token: Property.ShortText({
      displayName: 'Bearer Token',
      required: true,
    }),
  },
  description: markdown,
  required: true,
});
