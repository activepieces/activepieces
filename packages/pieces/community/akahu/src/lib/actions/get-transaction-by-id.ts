import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { akahuAuth } from '../..';
import { akahuCommon } from '../common/common';

export const getTransactionById = createAction({
  auth: akahuAuth,
  name: 'getTransactionById',
  displayName: 'Get Transaction By ID',
  description: `Get a single transaction from one of the user's connected accounts.`,
  props: {
    id: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'An Akahu Transaction ID',
      required: true,
    }),
  },
  async run(context) {
    const transactionId = context.propsValue.id;

    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${akahuCommon.baseUrl}/transactions/${transactionId}`,
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