import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getOrgPaymentAction = createAction({
  name: 'get_org_payment',
  displayName: 'Get Organization Payment Info',
  description: 'Retrieve payment information for your organization',
  audience: 'both',
  aiMetadata: { description: 'Read the organization\'s current payment information. Use to inspect the active billing details for the org before updating or deleting them. Read-only and idempotent; takes no inputs.', idempotent: true },
  auth: zooAuth,
  // category: 'Payments',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/org/payment',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
