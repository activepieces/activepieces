import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { akahuAuth } from '../..';
import { akahuCommon } from '../common/common';

export const getTransactions = createAction({
  auth: akahuAuth,
  name: 'getTransactions',
  displayName: 'Get Transactions',
  description: `Get a list of the user's transactions within the start and end time range. This endpoint returns settled transactions for all accounts that the user has connected to your application`,
  props: {
    start: akahuCommon.start,
    end: akahuCommon.end,
    cursor: akahuCommon.cursor,
  },
  async run({ auth, propsValue: { start, end, cursor } }) {
    const queryParams = {
      ...(start && { start: new Date(start).toISOString() }),
      ...(end && { end: new Date(end).toISOString() }),
      ...(cursor && { cursor: cursor }),
    };
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${akahuCommon.baseUrl}/transactions`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.user_token,
      },
      headers: {
        'X-Akahu-Id': auth.app_token,
      },
      queryParams,
    });
    return res.body;
  },
});
