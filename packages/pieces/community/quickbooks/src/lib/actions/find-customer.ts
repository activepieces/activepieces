import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../auth';
import { quickbooksCommon } from '../common';

export const findCustomer = createAction({
  name: 'find_customer',
  displayName: 'Find Customer',
  description: 'Find a customer in QuickBooks',
  auth: quickbooksAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search for customers by name, email, or other fields',
      required: false,
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The ID of the specific customer to retrieve',
      required: false,
    }),
    active_only: Property.Checkbox({
      displayName: 'Active Customers Only',
      description: 'If checked, only active customers will be returned',
      required: false,
      defaultValue: true,
    }),
    max_results: Property.Number({
      displayName: 'Maximum Results',
      description: 'Maximum number of results to return (default: 10, max: 1000)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    const { query, customer_id, active_only, max_results } = propsValue;

    // If customer_id is provided, get that specific customer
    if (customer_id) {
      return await quickbooksCommon.makeRequest({
        auth: auth,
        method: HttpMethod.GET,
        path: `customer/${customer_id}`,
      });
    }

    // Build the query string
    let queryString = '';

    if (query) {
      queryString = `${query}`;
    }

    if (active_only) {
      if (queryString) queryString += ' AND ';
      queryString += 'Active = true';
    }

    // Make the request to search for customers
    return await quickbooksCommon.makeRequest({
      auth: auth,
      method: HttpMethod.GET,
      path: 'query',
      query: {
        query: `SELECT * FROM Customer ${queryString ? 'WHERE ' + queryString : ''} MAXRESULTS ${max_results || 10}`,
      },
    });
  },
});
