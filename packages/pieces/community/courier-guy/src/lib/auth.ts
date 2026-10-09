import { PieceAuth, Property } from '@activepieces/pieces-framework';

const description = `
**Authentication**:
1. Log in to The Courier Guy customer portal at https://www.thecourierguy.co.za
2. Go to **Account → API Access** and generate an API key.
3. Paste the API key here.
`;

export const courierGuyAuth = PieceAuth.CustomAuth({
  description,
  required: true,
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
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
