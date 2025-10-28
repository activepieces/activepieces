import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchCustomer = createAction({
  auth: bigcommerceAuth,
  name: 'search_customer',
  displayName: 'Search Customer',
  description: 'Searches for customers in BigCommerce',
  props: {
    searchType: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Type of search to perform',
      required: true,
      defaultValue: 'email',
      options: {
        disabled: false,
        options: [
          { label: 'Email', value: 'email' },
          { label: 'First Name', value: 'first_name' },
          { label: 'Last Name', value: 'last_name' },
          { label: 'Company', value: 'company' },
          { label: 'Phone', value: 'phone' },
          { label: 'Customer ID', value: 'id' },
          { label: 'Customer Group ID', value: 'customer_group_id' },
          { label: 'Registration IP Address', value: 'registration_ip_address' },
          { label: 'Date Created', value: 'date_created' },
          { label: 'Date Modified', value: 'date_modified' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Value to search for',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 50, max: 250)',
      required: false,
      defaultValue: 50,
    }),
    includeFields: Property.ShortText({
      displayName: 'Include Fields',
      description: 'Comma-separated list of fields to include (e.g., id,email,first_name,last_name)',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort results by',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'ID', value: 'id' },
          { label: 'Email', value: 'email' },
          { label: 'First Name', value: 'first_name' },
          { label: 'Last Name', value: 'last_name' },
          { label: 'Company', value: 'company' },
          { label: 'Date Created', value: 'date_created' },
          { label: 'Date Modified', value: 'date_modified' },
        ],
      },
    }),
    sortDirection: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'Direction to sort results',
      required: false,
      defaultValue: 'asc',
      options: {
        disabled: false,
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
  },
  async run(context) {
    const { searchType, searchValue, limit, includeFields, sortBy, sortDirection } = context.propsValue;

    if (!searchType || !searchValue) {
      throw new Error('Search type and search value are required');
    }

    try {
      const queryParams: Record<string, string> = {
        limit: Math.min(limit || 50, 250).toString(),
      };

      // Use correct BigCommerce API query parameter names
      switch (searchType) {
        case 'email':
          queryParams['email:like'] = searchValue;
          break;
        case 'first_name':
          queryParams['first_name:like'] = searchValue;
          break;
        case 'last_name':
          queryParams['last_name:like'] = searchValue;
          break;
        case 'company':
          queryParams['company:like'] = searchValue;
          break;
        case 'phone':
          queryParams['phone:like'] = searchValue;
          break;
        case 'id':
          queryParams['id:in'] = searchValue;
          break;
        case 'customer_group_id':
          queryParams['customer_group_id'] = searchValue;
          break;
        case 'registration_ip_address':
          queryParams['registration_ip_address'] = searchValue;
          break;
        case 'date_created':
          queryParams['date_created'] = searchValue;
          break;
        case 'date_modified':
          queryParams['date_modified'] = searchValue;
          break;
        default:
          queryParams[searchType] = searchValue;
      }

      if (includeFields) {
        queryParams['include_fields'] = includeFields;
      }

      if (sortBy) {
        const direction = sortDirection || 'asc';
        queryParams['sort'] = `${sortBy}:${direction}`;
      }

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/customers',
        method: HttpMethod.GET,
        queryParams,
      });

      const customers = (response.body as { data: any[] }).data || [];

      return {
        success: true,
        customers,
        count: customers.length,
        message: `Found ${customers.length} customer(s) matching "${searchValue}"`,
      };
    } catch (error) {
      throw handleBigCommerceError(error, 'Failed to search customers');
    }
  },
});