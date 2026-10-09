import { PieceAuth, Property } from '@activepieces/pieces-framework';

const description = `
**Authentication**:
1. Log in to your Pargo merchant dashboard at https://merchant.pargo.co.za
2. Go to **Settings → API** and generate an API key.
3. Paste the API key here.
`;

export const pargoAuth = PieceAuth.CustomAuth({
  description,
  required: true,
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
    merchant_id: Property.ShortText({
      displayName: 'Merchant ID',
      required: false,
    }),
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      required: true,
      defaultValue: 'live',
      options: {
        options: [
          { label: 'Live', value: 'live' },
          { label: 'Sandbox', value: 'sandbox' },
        ],
      },
    }),
  },
  validate: async ({ auth }) => {
    if (!auth.api_key) return { valid: false, error: 'API Key required.' };
    return { valid: true };
  },
});
