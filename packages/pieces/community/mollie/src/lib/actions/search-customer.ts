import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { MollieApi } from '../common/common';

export const searchCustomerAction = createAction({
  auth: mollieAuth,
  name: 'search_customer',
  displayName: 'Search Customer',
  description: 'Finds customers based on filter',
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Customer ID ',
      required: true,
    }),
  },
  async run(context) {
    const api = new MollieApi({ accessToken: context.auth.access_token });
    
    const params: any = {};
    if (context.propsValue.customerId) params.from = context.propsValue.customerId;

    return await api.searchCustomers(params);
  },
});