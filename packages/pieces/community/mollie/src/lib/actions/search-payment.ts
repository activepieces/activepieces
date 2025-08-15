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
    paymentId: Property.ShortText({
      displayName: 'Payment ID',
      description: 'Payment ID ',
      required: true,
    }),
  },
  async run(context) {
    const api = new MollieApi({ accessToken: context.auth.access_token});
    
    const params: any = {};
    if (context.propsValue.limit) params.limit = context.propsValue.limit;
    if (context.propsValue.paymentId) params.from = context.propsValue.paymentId;

    return await api.searchPayments(params);
  },
});