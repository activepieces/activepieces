import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netsuiteAuth } from '../..';
import { NetSuiteClient } from '../common/client';

export const getCustomer = createAction({
  name: 'getCustomer',
  auth: netsuiteAuth,
  displayName: 'Get Customer',
  description: 'Gets customer details from NetSuite.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single customer record from NetSuite by its internal record ID. Use when you already have the customer ID and need its full details; this is a read-only lookup that is safe to repeat.',
    idempotent: true,
  },
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
      description: 'The ID of the customer to retrieve.',
    }),
  },
  async run(context) {
    const client = new NetSuiteClient(context.auth.props);
    const { customerId } = context.propsValue;

    return client.makeRequest({
      method: HttpMethod.GET,
      url: `${client.baseUrl}/services/rest/record/v1/customer/${customerId}`,
    });
  },
});
