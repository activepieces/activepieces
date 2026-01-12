import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { netsuiteAuth } from '../..';
import { createOAuthHeader } from '../oauth';

export const getCustomer = createAction({
  name: 'getCustomer',
  auth: netsuiteAuth,
  displayName: 'Get Customer',
  description: 'Gets customer details from NetSuite.',
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
      description: 'The ID of the customer to retrieve.',
    }),
  },
  async run(context) {
    const { accountId, consumerKey, consumerSecret, tokenId, tokenSecret } =
      context.auth.props;
    const { customerId } = context.propsValue;

    const requestUrl = `https://${accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/customer/${customerId}`;
    const httpMethod = HttpMethod.GET;

    const authHeader = createOAuthHeader(
      accountId,
      consumerKey,
      consumerSecret,
      tokenId,
      tokenSecret,
      requestUrl,
      httpMethod
    );

    const response = await httpClient.sendRequest({
      method: httpMethod,
      url: requestUrl,
      headers: {
        Authorization: authHeader,
        prefer: 'transient',
        Cookie: 'NS_ROUTING_VERSION=LAGGING',
      },
    });

    return response.body;
  },
});
