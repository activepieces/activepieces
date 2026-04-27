import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const baserowAuth = PieceAuth.CustomAuth({
  displayName: 'Database Token',
  description: `
  1. Log in to your Baserow Account.
  2. Click on your profile-pic(top-left) and navigate to **Settings->Database tokens**.
  3. Create new token with any name and appropriate workspace.
  4. After token creation,click on **:** right beside token name and copy database token.
  5. Enter your Baserow API URL.If you are using baserow.io, you can leave the default one.`,
  required: true,
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
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${auth.apiUrl}/api/database/tables/all-tables/`,
        headers: { Authorization: `Token ${auth.token}` },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid database token or API URL.' };
    }
  },
});

export type BaserowAuthValue = AppConnectionValueForAuthProperty<
  typeof baserowAuth
>;
