import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { netsuiteAuth } from '../..';
import { createOAuthHeader } from '../oauth';

export const getVendor = createAction({
  name: 'getVendor',
  auth: netsuiteAuth,
  displayName: 'Get Vendor',
  description: 'Gets vendor details from NetSuite.',
  props: {
    vendorId: Property.ShortText({
      displayName: 'Vendor ID',
      required: true,
      description: 'The ID of the vendor to retrieve.',
    }),
  },
  async run(context) {
    const { accountId, consumerKey, consumerSecret, tokenId, tokenSecret } = context.auth;
    const { vendorId } = context.propsValue;

    const baseUrl = `https://${accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/vendor/${vendorId}`;
    const httpMethod = HttpMethod.GET;

    const authHeader = createOAuthHeader(
      accountId,
      consumerKey,
      consumerSecret,
      tokenId,
      tokenSecret,
      baseUrl,
      httpMethod
    );

    const response = await httpClient.sendRequest({
      method: httpMethod,
      url: baseUrl,
      headers: {
        Authorization: authHeader,
        'prefer': 'transient',
        'Cookie': 'NS_ROUTING_VERSION=LAGGING',
      },
    });

    return response.body;
  },
});
