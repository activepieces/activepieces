import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { PieceAuth } from "@activepieces/pieces-framework";

export const beeboleAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: `To get your Beebole API token:

1. Log in to your Beebole account at https://beebole-apps.com
2. Go to **Customize → API Token**
3. Generate a new API token 
4. Copy the token and paste it below

Need help? See https://beebole.com/help/api`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://beebole-apps.com/api/v2',
        authentication: {
          type: AuthenticationType.BASIC,
          username: auth,
          password: 'x',
        },
        body: { service: 'company.list' },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid Beebole API token.' };
    }
  },
});
