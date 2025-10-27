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
          { label: 'City', value: 'city' },
          { label: 'State/Province', value: 'state_or_province' },
          { label: 'Country Code', value: 'country_code' },
          { label: 'Postal Code', value: 'postal_code' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Value to search for (leave empty to get all addresses)',
      required: false,
    }),
  },
  async run(context) {
    const { customerId, searchType, searchValue } = context.propsValue;

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    try {
      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: `/customers/${customerId}/addresses`,
        method: HttpMethod.GET,
      });

      let addresses = (response.body as { data: any[] }).data || [];

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