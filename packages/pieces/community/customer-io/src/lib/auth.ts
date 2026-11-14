import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdown = `Customer.io uses two kinds of keys:

1. **Tracking API key**: on the [Tracking API Keys](https://fly.customer.io/settings/api_credentials) tab, copy the **Site ID** and **API Key**.
2. **App API key**: on the [App API Keys](https://fly.customer.io/settings/api_credentials?keyType=app) tab, create a key and copy it.

[Learn more about Customer.io credentials](https://customer.io/docs/accounts-and-workspaces/managing-credentials/).
`;

export const customerIOAuth = PieceAuth.CustomAuth({
  props: {
    region: Property.StaticDropdown<'us' | 'eu'>({
      displayName: 'Region',
      description: 'Where your Customer.io workspace is hosted.',
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
      description: 'From your Tracking API key.',
      required: true,
    }),
    track_api_key: Property.ShortText({
      displayName: 'Tracking API Key',
      description: 'The API key paired with the Site ID.',
      required: true,
    }),
    api_bearer_token: Property.ShortText({
      displayName: 'App API Key',
      description: 'Used by the trigger and the App Custom API Call.',
      required: true,
    }),
  },
  description: markdown,
  required: true,
});
