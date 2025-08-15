import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';

export const mollieSearchCustomer = createAction({
  auth: mollieAuth,
  name: 'search_customer',
  displayName: 'Search Customer',
  description: 'Search for customers by various criteria',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'The criteria to search by',
      required: true,
      options: {
        options: [
          { label: 'Customer ID', value: 'id' },
          { label: 'Email', value: 'email' },
          { label: 'All Customers', value: 'all' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value to search for (Customer ID or Email)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { searchBy, searchValue, limit } = context.propsValue;

    if (searchBy === 'id' && searchValue) {
      try {
        const customer = await mollieCommon.getResource(
          context.auth,
          'customers',
          searchValue
        );
        return { customers: [customer], count: 1 };
      } catch (error) {
        return { customers: [], count: 0, error: 'Customer not found' };
      }
    }

    const queryParams: any = {
      limit: limit || 20,
    };

    const result = await mollieCommon.listResources(
      context.auth,
      'customers',
      queryParams
    );

    let customers = result._embedded?.customers || [];

    if (searchBy === 'email' && searchValue) {
      customers = customers.filter((customer: any) =>
        customer.email.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    return {
      customers,
      count: customers.length,
    };
  },
});
