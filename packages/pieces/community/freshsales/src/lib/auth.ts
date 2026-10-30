import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { freshsalesClient } from './common/client';

const markdownDescription = `
Connect your Freshsales (Freshworks CRM) account:

1. Log in to Freshsales and look at the address bar: **https://<alias>.myfreshworks.com**. The part before \`.myfreshworks.com\` is your alias.
2. Click your profile icon in the top-right corner and select **Settings**.
3. Open **API Settings** (under Personal settings).
4. Copy the API key shown on that page. If no key is shown, ask your Freshsales admin to enable API access for your user.
5. Paste the alias (e.g. \`acme\`, or the full URL) and the API key below.
`;

export const freshsalesAuth = PieceAuth.BasicAuth({
  displayName: 'Freshsales Connection',
  description: markdownDescription,
  username: Property.ShortText({
    displayName: 'Bundle alias',
    description: 'Alias or URL, e.g. acme or https://acme.myfreshworks.com',
    required: true,
  }),
  password: Property.ShortText({
    displayName: 'API Key',
    description: 'The API key from Settings > API Settings',
    required: true,
  }),
  required: true,
  validate: async ({ auth }) => {
    try {
      freshsalesClient.normalizeAlias(auth.username);
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid alias.',
      };
    }
    try {
      await freshsalesClient.request({
        auth,
        method: HttpMethod.GET,
        path: '/api/selector/owners',
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Could not connect to Freshsales. Check the alias and API key.',
      };
    }
  },
});
