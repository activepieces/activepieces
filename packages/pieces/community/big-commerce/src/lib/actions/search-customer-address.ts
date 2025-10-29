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
    // Note: BigCommerce API has limited filter support for addresses
    // Only customer_id:in and country_code are reliably supported
    // We'll filter other fields in code after fetching
    const queryParams: Record<string, string> = {};

    // Add search filters - only use supported filters
    if (customer_id) {
      queryParams['customer_id:in'] = customer_id.toString();
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

    // Filter results in code for unsupported API filters
    let filteredAddresses = response.body.data;

    if (company) {
      const companyLower = company.toLowerCase();
      filteredAddresses = filteredAddresses.filter(addr => 
        addr.company && addr.company.toLowerCase().includes(companyLower)
      );
    }

    if (city) {
      const cityLower = city.toLowerCase();
      filteredAddresses = filteredAddresses.filter(addr => 
        addr.city && addr.city.toLowerCase().includes(cityLower)
      );
    }

    if (state_or_province) {
      const stateLower = state_or_province.toLowerCase();
      filteredAddresses = filteredAddresses.filter(addr => 
        addr.state_or_province && addr.state_or_province.toLowerCase().includes(stateLower)
      );
    }

    if (postal_code) {
      const postalLower = postal_code.toLowerCase().replace(/\s/g, '');
      filteredAddresses = filteredAddresses.filter(addr => 
        addr.postal_code && addr.postal_code.toLowerCase().replace(/\s/g, '').includes(postalLower)
      );
    }

    return {
      addresses: filteredAddresses,
      total_found: filteredAddresses.length,
      count: filteredAddresses.length,
      pagination: response.body.meta.pagination,
    };
  },
});
