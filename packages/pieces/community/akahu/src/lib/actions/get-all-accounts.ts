import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { akahuAuth } from '../..';
import { akahuCommon } from '../common/common';

export const getAllAccounts = createAction({
  auth: akahuAuth,
  name: 'getAllAccounts',
  displayName: 'Get All Accounts',
  description:
    'Get a list of all accounts that the user has connected to your application.',
  props: {},
  async run(context) {
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${akahuCommon.baseUrl}/accounts`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.user_token,
      },
      headers: {
        accept: 'application/json',
        'X-Akahu-Id': context.auth.app_token,
      },
    });
    return res.body;
  },
});
