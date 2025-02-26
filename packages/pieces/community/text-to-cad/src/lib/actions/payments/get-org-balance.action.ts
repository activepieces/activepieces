import { createAction } from '@activepieces/pieces-framework';
import { textToCadAuth } from '../../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getOrgBalanceAction = createAction({
  name: 'get_org_balance',
  displayName: 'Get Organization Balance',
  description: 'Retrieve the current balance for your organization',
  auth: textToCadAuth,
  category: 'Payments',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/org/payment/balance',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
