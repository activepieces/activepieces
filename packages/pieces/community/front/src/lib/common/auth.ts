import { PieceAuth } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';


const frontApiUrl = 'https://api2.frontapp.com';

export const frontAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description:
`
To get your API token, you must be a **Company Admin** in Front.
1. Log in and go to **Settings** (⚙️ icon).
2. In the sidebar, click **Company**, then select **Developers**.
3. Click **New token** and give it a name (e.g., "Activepieces").
4. Select the necessary **Scopes** (permissions). We recommend selecting all **Shared resources** for full functionality.
5. Click **Create** and copy your token immediately. **It will only be shown once.**
`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${frontApiUrl}/me`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Token.',
      };
    }
  },
});
