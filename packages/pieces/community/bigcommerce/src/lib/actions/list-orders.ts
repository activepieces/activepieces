import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const listOrders = createAction({
  auth: bigcommerceAuth,
  name: 'listOrders',
  displayName: 'List Orders',
  description: 'Lists all orders',
  props: {
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'Filter by customer ID',
      required: false,
    }),
    status_id: Property.Number({
      displayName: 'Status ID',
      description: 'Filter by status ID',
      required: false,
    }),
  },
  async run(context) {
    const qParams = new URLSearchParams();
    if (context.propsValue.customer_id !== undefined && context.propsValue.customer_id !== null) qParams.append('customer_id', context.propsValue.customer_id.toString());
    if (context.propsValue.status_id !== undefined && context.propsValue.status_id !== null) qParams.append('status_id', context.propsValue.status_id.toString());
    
    return await bigCommerceApiService.fetchOrders({
      auth: context.auth.props,
      queryString: qParams.toString(),
    });
  },
});
