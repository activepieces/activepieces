import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netsuiteAuth } from '../..';
import { NetSuiteClient } from '../common/client';

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
    const client = new NetSuiteClient(context.auth.props);
    const { vendorId } = context.propsValue;

    return client.makeRequest({
      method: HttpMethod.GET,
      url: `${client.baseUrl}/services/rest/record/v1/vendor/${vendorId}`,
    });
  },
});
