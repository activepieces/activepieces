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
      description: 'Search by email address (exact match only)',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Search by customer name (partial match supported - searches first and last name)',
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
      name,
      company,
      customer_group_id,
      limit,
    } = context.propsValue;

    // Build query parameters
    // Note: BigCommerce Customers API has limited filter support
    // Supported: email:in, customer_group_id:in
    // NOT supported: name:like, company:like, first_name:like, last_name:like
    const queryParams: Record<string, string> = {};

    // Add search filters - only use supported filters
    // email:in - exact match for email
    if (email) {
      queryParams['email:in'] = email;
    }
    
    // customer_group_id - exact match
    if (customer_group_id !== undefined) {
      queryParams['customer_group_id:in'] = customer_group_id.toString();
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

    // Filter results in code for unsupported API filters
    let filteredCustomers = response.body.data;

    // name - partial match for customer name (searches first and last name)
    if (name) {
      const nameLower = name.toLowerCase();
      filteredCustomers = filteredCustomers.filter(customer => {
        const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
        return fullName.includes(nameLower) || 
               customer.first_name.toLowerCase().includes(nameLower) ||
               customer.last_name.toLowerCase().includes(nameLower);
      });
    }
    
    // company - partial match for company name
    if (company) {
      const companyLower = company.toLowerCase();
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.company && customer.company.toLowerCase().includes(companyLower)
      );
    }

    return {
      customers: filteredCustomers,
      total_found: filteredCustomers.length,
      count: filteredCustomers.length,
      pagination: response.body.meta.pagination,
    };
  },
});
