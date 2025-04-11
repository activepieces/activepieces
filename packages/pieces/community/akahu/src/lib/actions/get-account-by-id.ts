import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { akahuAuth } from '../..';
import { akahuCommon } from '../common/common';

export const getAccountById = createAction({
  auth: akahuAuth,
  name: 'getAccountById',
  displayName: 'Get Account By ID',
  description: "Get an individual account that the user has connected to your application.",
  props: {
    account_id: akahuCommon.account_id,
  },
  async run(context) {
    const accountId = context.propsValue.account_id;

    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${akahuCommon.baseUrl}/accounts/${accountId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.user_token,
      },
      headers: {
        'accept': 'application/json',
        'X-Akahu-Id': context.auth.app_token,
      },
    });
    return res.body;
  },
});