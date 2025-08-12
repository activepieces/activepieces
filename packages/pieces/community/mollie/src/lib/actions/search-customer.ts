import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { MollieApi } from '../common/common';

export const searchCustomerAction = createAction({
  auth: mollieAuth,
  name: 'search_customer',
  displayName: 'Search Customer',
  description: 'Finds customers based on filter',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of customers to return (max 250)',
      required: false,
      defaultValue: 50,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'Customer ID to start from',
      required: false,
    }),
  },
  async run(context) {
    const api = new MollieApi({ accessToken: context.auth.access_token });
    
    const params: any = {};
    if (context.propsValue.limit) params.limit = context.propsValue.limit;
    if (context.propsValue.from) params.from = context.propsValue.from;

    return await api.searchCustomers(params);
  },
});