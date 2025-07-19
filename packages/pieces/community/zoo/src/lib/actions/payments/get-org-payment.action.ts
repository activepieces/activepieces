import { createAction } from '@ensemble/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@ensemble/pieces-common';

export const getOrgPaymentAction = createAction({
  name: 'get_org_payment',
  displayName: 'Get Organization Payment Info',
  description: 'Retrieve payment information for your organization',
  auth: zooAuth,
  // category: 'Payments',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/org/payment',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
