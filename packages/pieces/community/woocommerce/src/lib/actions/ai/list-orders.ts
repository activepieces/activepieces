import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { listOrdersOutputSchema } from '../../output-schemas';

export const wooAiListOrders = createAction({
  name: 'list_orders',
  classification: 'SEARCH',
  displayName: 'List Orders',
  description: 'List orders, filtered by status, customer, product, text or date range.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches orders and returns them with totals, line items and addresses. Use it to find orders by status, customer id, product id, free text (such as an email or name) or creation date range; use get_order when you already have the order id. Paged: if a page returns exactly per_page items, request the next page.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: listOrdersOutputSchema,
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only return orders with this status. Leave empty for any status except trash.',
      required: false,
      options: { options: wooProps.orderStatusOptions },
    }),
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'Only return orders placed by this customer. Find the id with list_customers.',
      required: false,
    }),
    product_id: Property.Number({
      displayName: 'Product ID',
      description: 'Only return orders that contain this product.',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Text to match against order fields such as the billing name or email.',
      required: false,
    }),
    after: Property.DateTime({
      displayName: 'Created After',
      description: 'Only return orders created after this date and time (ISO 8601).',
      required: false,
    }),
    before: Property.DateTime({
      displayName: 'Created Before',
      description: 'Only return orders created before this date and time (ISO 8601).',
      required: false,
    }),
    orderby: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to date.',
      required: false,
      options: {
        options: [
          { label: 'Date', value: 'date' },
          { label: 'ID', value: 'id' },
          { label: 'Title', value: 'title' },
          { label: 'Slug', value: 'slug' },
        ],
      },
    }),
    order: wooProps.sortOrderProp(),
    page: wooProps.pageProp(),
    per_page: wooProps.perPageProp(),
  },
  async run(context) {
    const props = context.propsValue;
    const paging = await wooValues.paging({ page: props.page, perPage: props.per_page });
    return wooClient.request<unknown[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/orders',
      queryParams: {
        status: props.status,
        customer: props.customer_id,
        product: props.product_id,
        search: wooValues.nonEmpty(props.search),
        after: wooValues.nonEmpty(props.after),
        before: wooValues.nonEmpty(props.before),
        orderby: props.orderby,
        order: props.order,
        ...paging,
      },
    });
  },
});
