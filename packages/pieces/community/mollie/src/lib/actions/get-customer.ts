import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon, MollieCustomer } from '../common';

export const mollieGetCustomer = createAction({
  auth: mollieAuth,
  name: 'get_customer',
  displayName: 'Get Customer',
  description: 'Retrieve a specific customer by ID',
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The ID of the customer to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const customer = await mollieCommon.getResource<MollieCustomer>(
      context.auth,
      'customers',
      context.propsValue.customerId
    );

    return customer;
  },
});