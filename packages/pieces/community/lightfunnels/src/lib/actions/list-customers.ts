import { createAction, Property } from '@activepieces/pieces-framework';
import { lightfunnelsAuth } from '../../index';
import { lightfunnelsCommon } from '../common/index';

export const listCustomers = createAction({
  auth: lightfunnelsAuth,
  name: 'list_customers',
  displayName: 'List Customers',
  description: 'Retrieve a list of customers',
  props: {
    first: Property.Number({
      displayName: 'Limit',
      description: 'Number of customers to retrieve (default: 10)',
      required: false,
      defaultValue: 10,
    }),
    after: Property.ShortText({
      displayName: 'After Cursor',
      description: 'Cursor for pagination (optional)',
      required: false,
    }),
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Filter query (e.g., "order_by:created_at order_dir:desc")',
      required: false,
      defaultValue: 'order_by:created_at order_dir:desc',
    }),
  },
  async run(context) {
    const { first, after, query } = context.propsValue;

    const graphqlQuery = `
      query customersQuery($first: Int, $after: String, $query: String!) {
        customers(first: $first, after: $after, query: $query) {
          edges {
            node {
              id
              _id
              avatar
              email
              full_name
              phone
              updated_at
              created_at
              location
            }
            expenses
            orders_count
            cursor
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    `;

    const response = await lightfunnelsCommon.makeGraphQLRequest(
      context.auth,
      graphqlQuery,
      {
        first: first || 10,
        after: after || null,
        query: query || 'order_by:created_at order_dir:desc',
      },
    );

    return response.data.customers;
  },
});
