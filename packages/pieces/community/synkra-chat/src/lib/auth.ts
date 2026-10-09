import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const description = `
**Authentication**:

1. Log in to your Synkra Chat account.
2. Click your avatar (bottom left) and open **Profile Settings**.
3. Scroll to **Access Token** and copy it.
4. Paste the token here.
5. Enter your **Account ID**. This is the number in your Synkra Chat URL, for example /app/accounts/3/ means the account ID is 3.
`;

export const synkraChatAuth = PieceAuth.CustomAuth({
  description,
  required: true,
  props: {
    access_token: PieceAuth.SecretText({
      displayName: 'Access Token',
      description: 'Your Synkra Chat personal access token.',
      required: true,
    }),
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'The numeric account ID from your Synkra Chat URL.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://chat.synkra.co.za/api/v1/accounts/${auth.account_id}/contacts`,
        headers: { api_access_token: auth.access_token },
        queryParams: { page: '1' },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: `Could not reach Synkra Chat. Check the access token and account ID. (${(e as Error).message})`,
      };
    }
  },
});
