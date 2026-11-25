import { PieceAuth } from '@activepieces/pieces-framework';

export const sendfoxAuth = PieceAuth.SecretText({
  displayName: 'Personal Access Token',
  description: `To get your personal access token:
1. In SendFox, open **Settings → Connections → API tokens**, or go to [sendfox.com/account/oauth](https://sendfox.com/account/oauth).
2. Under **Personal Access Tokens**, click **Create New Token**.
3. Enter a name for the token and click **Create**.
4. Copy the token right away (SendFox shows it only once) and paste it here.`,
  required: true,
});
