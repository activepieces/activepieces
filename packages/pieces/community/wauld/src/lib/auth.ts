import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const WAULD_BASE_URL = 'https://wauld.app';

type GetAccountResponse = {
  id: string;
  organizationName?: string;
  email?: string;
};

export const wauldAuth = PieceAuth.CustomAuth({
  displayName: 'Wauld Connection',
  description:
    'Enter the access token and Account ID from your Wauld account.',
  required: true,
  props: {
    accessToken: PieceAuth.SecretText({
      displayName: 'Access Token',
      description: 'You can find your Activepieces Token in Wauld under Integrations >> Activepieces Integration. Click Generate Token, then copy and paste the token here.',
      required: true,
    }),
    accountId: Property.ShortText({
      displayName: 'Account ID',
      description: 'You can find your Wauld Account ID in the URL after wauld.app/. It starts with acc_. Copy and paste it here.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest<GetAccountResponse>({
        method: HttpMethod.POST,
        url: `${WAULD_BASE_URL}/wauld.AccountService/GetAccount`,
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Connect-Protocol-Version': '1',
          'Content-Type': 'application/json',
        },
        body: {
          id: auth.accountId,
        },
      });

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error:
          'Unable to connect to Wauld. Check your access token and Account ID.',
      };
    }
  },
});