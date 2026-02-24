import { createAction, Property } from '@activepieces/pieces-framework';
import { lightfunnelsAuth } from '../../index';
import { lightfunnelsCommon } from '../common/index';

export const listProducts = createAction({
  auth: lightfunnelsAuth,
  name: 'list_products',
  displayName: 'List Products',
  description: 'Retrieve a list of all products',
  props: {
    first: Property.Number({
      displayName: 'Limit',
      description: 'Number of products to retrieve (default: 10)',
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
      description: 'Filter query (e.g., "order_by:id order_dir:desc last_month")',
      required: false,
      defaultValue: 'order_by:id order_dir:desc',
    }),
  },
  async run(context) {
    const { first, after, query } = context.propsValue;

    const graphqlQuery = `
      query productsQuery($first: Int, $after: String, $query: String!) {
        products(query: $query, after: $after, first: $first) {
          edges {
            node {
              id
              _id
              uid
              slug
              title
              description
              notice_text
              price
              sku
              file_id
              compare_at_price
              product_type
              thumbnail {
                id
                path
              }
              file {
                id
                title
                size
                path
              }
              tags {
                id
                title
              }
              variants {
                id
                price
                compare_at_price
                sku
                enable_inventory_limit
                inventory_quantity
              }
              inventory_quantity
              enable_inventory_limit
              created_at
              updated_at
            }
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
        query: query || 'order_by:id order_dir:desc',
      },
    );

    return response.data.products;
  },
})
