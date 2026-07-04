import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

export const listOrders = createAction({
  auth: bigcommerceAuth,
  name: 'listOrders',
  displayName: 'List Orders',
  description: 'Lists all orders',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists orders from a BigCommerce store. With no filters it returns all orders; optionally narrow by customer_id and/or status_id to a subset. Use to browse or find orders when you do not have a specific order id. Idempotent read-only query with no side effects.',
    idempotent: true,
  },
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
