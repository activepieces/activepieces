import { Property, createAction } from '@activepieces/pieces-framework';
import { getOrdersByDate } from '../api';
import { cartloomAuth } from '../auth';

export const getOrderDateAction = createAction({
  name: 'get_orders_by_date',
  auth: cartloomAuth,
  displayName: 'Get Order by Date',
  description: 'Get a list of orders from Cartloom within a date range',
  audience: 'both',
  aiMetadata: { description: 'Lists all Cartloom orders placed within a date range. Use to retrieve orders for a period when you do not have specific invoice IDs; to narrow results to one customer, use Get Order by Email instead. Requires a start date; the end date defaults to today. Read-only and idempotent.', idempotent: true },
  props: {
    start: Property.DateTime({
      displayName: 'Start Date',
      description: 'Select a date to start the search',
      required: true,
    }),
    end: Property.DateTime({
      displayName: 'End Date',
      description: 'Select a date to end the search. Defaults to today.',
      required: false,
    }),
  },
  async run(context) {
    return await getOrdersByDate(context.auth.props, {
      start_date: context.propsValue.start.split('T')[0],
      end_date:
        context.propsValue.end || new Date().toISOString().split('T')[0],
    });
  },
});
