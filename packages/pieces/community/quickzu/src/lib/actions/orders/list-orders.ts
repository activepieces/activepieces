import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../..';
import { makeClient } from '../../common';

export const listOrdersAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_list_orders',
  displayName: 'List Orders',
  description: 'Retrieves orders of store.',
  props: {
    page: Property.Number({
      displayName: 'Current page number',
      required: true,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Number of orders per page',
      required: true,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { page, limit } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.listOrders(page, limit);
  },
});
