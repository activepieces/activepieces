import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const flowluAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
  1. Log in to your flowlu account.
  2. Click on your profile-pic(top-right) and navigate to **Portal Settings->API Settings**.
  3. Create new API key with any name and appropriate scope.
  4. Copy API Key to your clipboard and paste it in  **API Key** field
  5. In the Domain field, enter your company from your account URL address. For example, if your account URL address is https://example.flowlu.com, then your domain is **example**.
  `,
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
});
