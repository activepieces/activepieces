import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { akahuAuth } from '../..';
import { akahuCommon } from '../common/common';

export const getTransactionsByAccount = createAction({
  auth: akahuAuth,
  name: 'getTransactionsByAccount',
  displayName: 'Get Transactions By Account',
  description: `Get a list of the user's transactions for a specific connected account within the start and end time range. This endpoint returns settled transactions.`,
  props: {
    account_id: akahuCommon.account_id,
    start: akahuCommon.start,
    end: akahuCommon.end,
    cursor: akahuCommon.cursor
  },
  async run({ auth, propsValue: { account_id, start, end, cursor } }) {
    const queryParams = {
      ...(start && { start: new Date(start).toISOString() }),
      ...(end && { end: new Date(end).toISOString() }),
      ...(cursor && { cursor: cursor }),
    };
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${akahuCommon.baseUrl}/accounts/${account_id}/transactions`,
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
