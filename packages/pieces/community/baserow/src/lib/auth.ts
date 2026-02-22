import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const baserowAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
  1. Log in to your Baserow Account.
  2. Click on your profile-pic(top-left) and navigate to **Settings->Database tokens**.
  3. Create new token with any name and appropriate workspace.
  4. After token creation,click on **:** right beside token name and copy database token.
  5. Enter your Baserow API URL.If you are using baserow.io, you can leave the default one.`,
  props: {
    apiUrl: Property.ShortText({
      displayName: 'API URL',
      required: true,
      defaultValue: 'https://api.baserow.io',
    }),
    token: PieceAuth.SecretText({
      displayName: 'Database Token',
      required: true,
    }),
  },
});
