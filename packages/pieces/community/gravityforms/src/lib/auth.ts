import { AppConnectionType, PieceAuth, Property, tryCatch } from '@activepieces/pieces-framework';
import { gravityFormsApi } from './common/api';

const authGuide = `
1. In WordPress, go to **Forms > Settings > REST API** and tick **Enabled** under "Enable access to the API".
2. Under **Authentication (API version 2)**, click **Add Key**, pick an administrator user and set **Permissions** to **Read/Write**.
3. Copy the **Consumer Key** and **Consumer Secret**; they are shown only once.
4. **Site URL** is your WordPress home address. It must start with https.
`;

export const gravityFormsAuth = PieceAuth.CustomAuth({
  description: authGuide,
  required: true,
  props: {
    siteUrl: Property.ShortText({
      displayName: 'Site URL',
      description: 'Your WordPress site address, e.g. https://example.com',
      required: true,
    }),
    consumerKey: Property.ShortText({
      displayName: 'Consumer Key',
      required: true,
    }),
    consumerSecret: PieceAuth.SecretText({
      displayName: 'Consumer Secret',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      gravityFormsApi.listForms({ auth: { type: AppConnectionType.CUSTOM_AUTH, props: auth } }),
    );
    if (error) {
      return {
        valid: false,
        error: 'Could not connect to Gravity Forms. Check the site URL (HTTPS), that the REST API is enabled, and the consumer key and secret.',
      };
    }
    return { valid: true };
  },
});
