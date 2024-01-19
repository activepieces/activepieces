import { Property, createAction } from '@activepieces/pieces-framework';
import { getOrdersByDate } from '../api';
import { cartloomAuth } from '../auth';

export const getOrderDateAction = createAction({
  name: 'get_orders_by_date',
  auth: cartloomAuth,
  displayName: 'Get Order by Date',
  description: 'Get a list of orders from Cartloom within a date range',
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
    return await getOrdersByDate(context.auth, {
      start_date: context.propsValue.start.split('T')[0],
      end_date:
        context.propsValue.end || new Date().toISOString().split('T')[0],
    });
  },
});
