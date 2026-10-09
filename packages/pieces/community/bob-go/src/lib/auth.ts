import { PieceAuth, Property } from '@activepieces/pieces-framework';

const description = `
**Authentication**:
1. Log in to Bob Go at https://bobgo.co.za
2. Go to **Settings → Integrations → API** and generate an API token.
3. Paste the token here.
`;

export const bobGoAuth = PieceAuth.CustomAuth({
  description,
  required: true,
  props: {
    api_token: PieceAuth.SecretText({
      displayName: 'API Token',
      required: true,
    }),
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'Your Bob Go account ID (visible in Settings).',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    if (!auth.api_token) return { valid: false, error: 'API Token required.' };
    return { valid: true };
  },
});
