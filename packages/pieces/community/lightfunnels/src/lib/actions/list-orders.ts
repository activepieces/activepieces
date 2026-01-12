import { createAction, Property } from '@activepieces/pieces-framework';
import { lightfunnelsAuth } from '../../index';
import { lightfunnelsCommon } from '../common/index';

export const listOrders = createAction({
  auth: lightfunnelsAuth,
  name: 'list_orders',
  displayName: 'List Orders',
  description: 'Retrieve a list of orders',
  props: {
    first: Property.Number({
      displayName: 'Limit',
      description: 'Number of orders to retrieve (default: 10)',
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
      query ordersQuery($first: Int, $after: String, $query: String!) {
        orders(first: $first, after: $after, query: $query) {
          edges {
            node {
              id
              _id
              name
              total
              fulfillment_status
              financial_status
              customer {
                full_name
                id
              }
              cancelled_at
              date: created_at
              formattedDate: created_at(format: "LLL")
              test
              currency
              checkout {
                id
                store {
                  id
                  name
                }
                funnel {
                  id
                  name
                }
              }
              tags
            }
            cursor
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
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

    return response.data.orders;
  },
});
