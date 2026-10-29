import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { calltidycalapi } from './common';

const markdown = `To create a personal access token:
1. In TidyCal, open [Manage API keys](https://tidycal.com/integrations/advanced) under Integrations.
2. On the **Personal tokens** tab, click **Create token**, enter a name and click **Create**.
3. Copy the token now: TidyCal shows it only once.

API access needs a paid TidyCal plan.`;

export const tidyCalAuth = PieceAuth.SecretText({
  displayName: 'Personal Access Token',
  description: markdown,
  required: true,
  validate: async ({ auth }) => {
    try {
      await calltidycalapi(HttpMethod.GET, 'bookings', {
        type: AppConnectionType.SECRET_TEXT,
        secret_text: auth,
      }, undefined);
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid personal access token.',
      };
    }
  },
});
