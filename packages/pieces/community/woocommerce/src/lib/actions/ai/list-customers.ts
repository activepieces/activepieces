import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { listCustomersOutputSchema } from '../../output-schemas';

export const wooAiListCustomers = createAction({
  name: 'list_customers',
  classification: 'SEARCH',
  displayName: 'List Customers',
  description: 'List customers, filtered by email, text or role.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches store customers and returns them with their ids, emails and addresses. Use it to find a customer id by exact email or by name before get_customer, update_customer, create_order or list_orders; role defaults to all, so shop staff and administrators are included. Paged: if a page returns exactly per_page items, request the next page.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: listCustomersOutputSchema,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Exact email address to match.',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Text to match against names, usernames and emails.',
      required: false,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'WordPress role to return. Defaults to all roles.',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All roles', value: 'all' },
          { label: 'Customer', value: 'customer' },
          { label: 'Subscriber', value: 'subscriber' },
          { label: 'Shop manager', value: 'shop_manager' },
          { label: 'Administrator', value: 'administrator' },
        ],
      },
    }),
    orderby: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to name.',
      required: false,
      options: {
        options: [
          { label: 'Name', value: 'name' },
          { label: 'ID', value: 'id' },
          { label: 'Registration date', value: 'registered_date' },
        ],
      },
    }),
    order: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'Ascending or descending. Defaults to ascending.',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
    page: wooProps.pageProp(),
    per_page: wooProps.perPageProp(),
  },
  async run(context) {
    const props = context.propsValue;
    const paging = await wooValues.paging({ page: props.page, perPage: props.per_page });
    return wooClient.request<unknown[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/customers',
      queryParams: {
        email: wooValues.nonEmpty(props.email),
        search: wooValues.nonEmpty(props.search),
        role: props.role ?? 'all',
        orderby: props.orderby,
        order: props.order,
        ...paging,
      },
    });
  },
});
