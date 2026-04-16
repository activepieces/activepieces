import { createAction, Property } from '@activepieces/pieces-framework';
import { billsbyAuth, BillsbyAuthType } from '../auth';
import { billsbyRequest } from '../common/client';

export const getCustomerAction = createAction({
  auth: billsbyAuth,
  name: 'get_customer',
  displayName: 'Get Customer',
  description: 'Get a customer by ID from Billsby.',
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
    }),
  },
  async run(context) {
    const { customer_id } = context.propsValue;

    return await billsbyRequest({
      auth: context.auth as BillsbyAuthType,
      path: `/customers/${customer_id}`,
    });
  },
});
