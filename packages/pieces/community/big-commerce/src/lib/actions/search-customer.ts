import { createAction, Property } from '@activepieces/pieces-framework';
import { bigCommerceAuth } from '../..';
import { sendBigCommerceRequest, BigCommerceAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchCustomer = createAction({
  auth: bigCommerceAuth,
  name: 'search_customer',
  displayName: 'Search Customer',
  description: 'Search for registered customers in BigCommerce',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search by email address (partial match supported)',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Search by first name (partial match supported)',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Search by last name (partial match supported)',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Search by company name (partial match supported)',
      required: false,
    }),
    customer_group_id: Property.Number({
      displayName: 'Customer Group ID',
      description: 'Filter by customer group ID (exact match)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 50, max: 250)',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const {
      email,
      first_name,
      last_name,
      company,
      customer_group_id,
      limit,
    } = context.propsValue;

    // Build query parameters
    const queryParams: Record<string, string> = {};

    // Add search filters (using :like for partial matches)
    if (email) {
      queryParams['email:like'] = email;
    }
    if (first_name) {
      queryParams['first_name:like'] = first_name;
    }
    if (last_name) {
      queryParams['last_name:like'] = last_name;
    }
    if (company) {
      queryParams['company:like'] = company;
    }
    if (customer_group_id !== undefined) {
      queryParams['customer_group_id'] = customer_group_id.toString();
    }

    // Add limit
    if (limit) {
      queryParams['limit'] = Math.min(limit, 250).toString();
    }

    // Send request to search customers
    const response = await sendBigCommerceRequest<{
      data: Array<{
        id: number;
        email: string;
        first_name: string;
        last_name: string;
        company: string;
        phone: string;
        notes: string;
        tax_exempt_category: string;
        customer_group_id: number;
        date_created: string;
        date_modified: string;
        address_count: number;
        attribute_count: number;
      }>;
      meta: {
        pagination: {
          total: number;
          count: number;
          per_page: number;
          current_page: number;
          total_pages: number;
        };
      };
    }>({
      auth: context.auth as BigCommerceAuth,
      method: HttpMethod.GET,
      url: '/customers',
      queryParams,
    });

    return {
      customers: response.body.data,
      total_found: response.body.meta.pagination.total,
      count: response.body.data.length,
      pagination: response.body.meta.pagination,
    };
  },
});
