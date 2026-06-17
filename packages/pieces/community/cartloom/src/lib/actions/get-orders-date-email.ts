import { Property, createAction } from '@activepieces/pieces-framework';
import { getOrdersByDate } from '../api';
import { cartloomAuth } from '../auth';

export const getOrderEmailAction = createAction({
  name: 'get_orders_by_email',
  auth: cartloomAuth,
  displayName: 'Get Order by Email',
  description: 'Get a list of orders for an email within a date range',
  audience: 'both',
  aiMetadata: { description: "Lists Cartloom orders placed by a specific customer email address within a date range. Use to find a customer's order history; use Get Order by Date to list all orders regardless of customer. Requires the email and a start date; the end date defaults to today. Read-only and idempotent.", idempotent: true },
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
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to search for.',
      required: true,
    }),
  },
  async run(context) {
    return await getOrdersByDate(context.auth.props, {
      search_type: 'email',
      keyword: context.propsValue.email,
      start_date: context.propsValue.start.split('T')[0],
      end_date:
        context.propsValue.end || new Date().toISOString().split('T')[0],
    });
  },
});
