import { PieceAuth, Property } from '@activepieces/pieces-framework';

const description = `
**Authentication**:
1. Log in to your iKhokha merchant portal at https://merchant.ikhokha.com
2. Go to **Integrations → API Keys** and generate an API key pair.
3. Copy your **Application ID** and **Application Secret**.
4. Paste both here.

The secret is used to sign every request with HMAC SHA256.
`;

export const ikhokhaAuth = PieceAuth.CustomAuth({
  description,
  required: true,
  props: {
    app_id: Property.ShortText({
      displayName: 'Application ID',
      description: 'Your iKhokha application ID.',
      required: true,
    }),
    app_secret: PieceAuth.SecretText({
      displayName: 'Application Secret',
      required: true,
    }),
    sandbox: Property.Checkbox({
      displayName: 'Sandbox',
      required: false,
      defaultValue: false,
    }),
  },
  validate: async ({ auth }) => {
    if (!auth.app_id || !auth.app_secret) {
      return { valid: false, error: 'Application ID and Secret are required.' };
    }
    return { valid: true };
  },
});
