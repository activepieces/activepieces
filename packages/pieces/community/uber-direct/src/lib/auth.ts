import { PieceAuth, Property } from '@activepieces/pieces-framework';

const description = `
**Authentication**:
1. In your Uber Direct merchant dashboard go to **Developer → API Credentials**.
2. Copy your **Customer ID** and **Server Token**.
3. Paste both here.
`;

export const uberDirectAuth = PieceAuth.CustomAuth({
  description,
  required: true,
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
    }),
    server_token: PieceAuth.SecretText({
      displayName: 'Server Token',
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
    if (!auth.customer_id || !auth.server_token) {
      return { valid: false, error: 'Customer ID and Server Token required.' };
    }
    return { valid: true };
  },
});
