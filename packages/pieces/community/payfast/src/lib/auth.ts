import { PieceAuth, Property } from '@activepieces/pieces-framework';

const description = `
**Authentication**:
1. Log in to your PayFast dashboard at https://www.payfast.co.za
2. Go to **Settings → Integration** and copy your **Merchant ID** and **Merchant Key**.
3. Set a **Passphrase** under **Settings → Integration**. Copy it here.
4. For refunds and API lookups, create an **API User** under **Settings → API User** and copy its credentials too.
5. Tick **Sandbox** if you are using https://sandbox.payfast.co.za for testing.
`;

export const payfastAuth = PieceAuth.CustomAuth({
  description,
  required: true,
  props: {
    merchant_id: Property.ShortText({
      displayName: 'Merchant ID',
      description: 'Your PayFast merchant ID (numeric).',
      required: true,
    }),
    merchant_key: PieceAuth.SecretText({
      displayName: 'Merchant Key',
      description: 'Your PayFast merchant key.',
      required: true,
    }),
    passphrase: PieceAuth.SecretText({
      displayName: 'Passphrase',
      description: 'The passphrase set under Settings → Integration.',
      required: true,
    }),
    api_user: Property.ShortText({
      displayName: 'API User ID',
      description:
        'Required for refunds and transaction lookups. Create under Settings → API User.',
      required: false,
    }),
    api_password: PieceAuth.SecretText({
      displayName: 'API Password',
      description: 'Password for the API user.',
      required: false,
    }),
    sandbox: Property.Checkbox({
      displayName: 'Sandbox',
      description: 'Use the PayFast sandbox environment (testing only).',
      required: false,
      defaultValue: false,
    }),
  },
  validate: async ({ auth }) => {
    if (!auth.merchant_id || !auth.merchant_key) {
      return {
        valid: false,
        error: 'Merchant ID and Merchant Key are required.',
      };
    }
    return { valid: true };
  },
});
