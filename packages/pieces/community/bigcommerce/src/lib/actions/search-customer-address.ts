import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { customerIdDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchCustomerAddress = createAction({
  auth: bigcommerceAuth,
  name: 'search_customer_address',
  displayName: 'Search Customer Address',
  description: 'Searches for addresses of a specific customer in BigCommerce',
  props: {
    customerId: customerIdDropdown,
    searchType: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Type of search to perform',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'All Addresses', value: 'all' },
          { label: 'Address Line 1', value: 'address1' },
          { label: 'Address Line 2', value: 'address2' },
          { label: 'City', value: 'city' },
          { label: 'State/Province', value: 'state_or_province' },
          { label: 'Country Code', value: 'country_code' },
          { label: 'Postal Code', value: 'postal_code' },
          { label: 'Company', value: 'company' },
          { label: 'Phone', value: 'phone' },
          { label: 'Address Type', value: 'address_type' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Value to search for (leave empty to get all addresses)',
      required: false,
    }),
    includeFields: Property.ShortText({
      displayName: 'Include Fields',
      description: 'Comma-separated list of fields to include (e.g., id,address1,city,country_code)',
      required: false,
    }),
  },
  async run(context) {
    const { customerId, searchType, searchValue, includeFields } = context.propsValue;

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    try {
      const queryParams: Record<string, string> = {};

      if (includeFields) {
        queryParams['include_fields'] = includeFields;
      }

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: `/customers/${customerId}/addresses`,
        method: HttpMethod.GET,
        queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      });

      let addresses = (response.body as { data: any[] }).data || [];

      // Filter addresses based on search criteria
      if (searchType && searchType !== 'all' && searchValue) {
        addresses = addresses.filter((address: any) => {
          const fieldValue = address[searchType];
          return fieldValue && fieldValue.toString().toLowerCase().includes(searchValue.toLowerCase());
        });
      }

      return {
        success: true,
        addresses,
        count: addresses.length,
        message: `Found ${addresses.length} address(es) for customer ${customerId}`,
      };
    } catch (error) {
      throw handleBigCommerceError(error, 'Failed to search customer addresses');
    }
  },
});