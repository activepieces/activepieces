import { createAction, Property } from '@activepieces/pieces-framework';
import { bigCommerceAuth } from '../..';
import { sendBigCommerceRequest, BigCommerceAuth, bigCommerceCommon } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchCustomerAddress = createAction({
  auth: bigCommerceAuth,
  name: 'search_customer_address',
  displayName: 'Search Customer Address',
  description: "Search for a customer's addresses in BigCommerce",
  props: {
    customer_id: Property.Dropdown({
      displayName: 'Customer (Optional)',
      description: 'Filter addresses by customer (leave empty to search all addresses)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your BigCommerce account',
          };
        }

        try {
          const response = await sendBigCommerceRequest<{
            data: Array<{ id: number; email: string; first_name: string; last_name: string }>;
          }>({
            auth: auth as BigCommerceAuth,
            method: HttpMethod.GET,
            url: '/customers',
            queryParams: {
              limit: '250',
            },
          });

          const customers = response.body.data || [];
          return {
            disabled: false,
            options: customers.map((customer) => ({
              label: `${customer.first_name} ${customer.last_name} (${customer.email})`,
              value: customer.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load customers',
          };
        }
      },
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Filter by company name (partial match supported)',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'Filter by city name (partial match supported)',
      required: false,
    }),
    state_or_province: Property.ShortText({
      displayName: 'State or Province',
      description: 'Filter by state or province (partial match supported)',
      required: false,
    }),
    postal_code: Property.ShortText({
      displayName: 'Postal Code',
      description: 'Filter by postal/ZIP code (partial match supported)',
      required: false,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: 'Filter by country code (exact match, e.g., US, CA, GB)',
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
      customer_id,
      company,
      city,
      state_or_province,
      postal_code,
      country_code,
      limit,
    } = context.propsValue;

    // Build query parameters
    const queryParams: Record<string, string> = {};

    // Add search filters
    if (customer_id) {
      queryParams['customer_id:in'] = customer_id.toString();
    }
    if (company) {
      queryParams['company:like'] = company;
    }
    if (city) {
      queryParams['city:like'] = city;
    }
    if (state_or_province) {
      queryParams['state_or_province:like'] = state_or_province;
    }
    if (postal_code) {
      queryParams['postal_code:like'] = postal_code;
    }
    if (country_code) {
      queryParams['country_code'] = country_code;
    }

    // Add limit
    if (limit) {
      queryParams['limit'] = Math.min(limit, 250).toString();
    }

    // Send request to search customer addresses
    const response = await sendBigCommerceRequest<{
      data: Array<{
        id: number;
        customer_id: number;
        first_name: string;
        last_name: string;
        company: string;
        address1: string;
        address2: string;
        city: string;
        state_or_province: string;
        postal_code: string;
        country_code: string;
        phone: string;
        address_type: string;
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
      url: '/customers/addresses',
      queryParams,
    });

    return {
      addresses: response.body.data,
      total_found: response.body.meta.pagination.total,
      count: response.body.data.length,
      pagination: response.body.meta.pagination,
    };
  },
});
