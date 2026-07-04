import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { CustomerListFilter } from '../../common/models/customer';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'list_customers',
  displayName: 'Get Customers',
  description: 'Fetches customers from clockodo',
  audience: 'both',
  aiMetadata: { description: 'List clockodo customers, optionally filtered by active status. Read-only and repeatable. Use to discover customers or resolve a customer ID by name before another call; supply a page number to read one page at a time, or omit it to retrieve all matching customers.', idempotent: true },
  props: {
    active_filter: Property.Checkbox({
      displayName: 'Active Filter',
      description: 'Filter customers by their active status',
      required: false,
      defaultValue: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Reads only the specified page',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    const filter: CustomerListFilter = {
      active: propsValue.active_filter,
    };
    if (propsValue.page !== undefined) {
      const res = await client.listCustomers({
        page: propsValue.page,
        filter,
      });
      return {
        pagination: res.paging,
        customers: res.customers,
      };
    } else {
      const customers = await client.listAllCustomers(filter);
      return {
        customers,
      };
    }
  },
});
