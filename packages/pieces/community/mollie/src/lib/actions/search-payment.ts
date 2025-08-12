import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { MollieApi } from '../common/common';

export const searchPaymentAction = createAction({
  auth: mollieAuth,
  name: 'search_payment',
  displayName: 'Search Payment',
  description: 'Searches for payment',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of payments to return (max 250)',
      required: false,
      defaultValue: 50,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'Payment ID to start from',
      required: false,
    }),
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Filter by customer ID',
      required: false,
    }),
  },
  async run(context) {
    const api = new MollieApi({ accessToken: context.auth.access_token});
    
    const params: any = {};
    if (context.propsValue.limit) params.limit = context.propsValue.limit;
    if (context.propsValue.from) params.from = context.propsValue.from;
    if (context.propsValue.customerId) params.customerId = context.propsValue.customerId;

    return await api.searchPayments(params);
  },
});