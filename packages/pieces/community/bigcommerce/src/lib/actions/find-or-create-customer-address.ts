import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { customerIdDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

const getAddressFields = (): DynamicPropsValue => {
  return {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Company name',
      required: false,
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      description: 'Secondary address line',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City',
      required: true,
    }),
    state_or_province: Property.ShortText({
      displayName: 'State/Province',
      description: 'State or province',
      required: true,
    }),
    postal_code: Property.ShortText({
      displayName: 'Postal Code',
      description: 'Postal/ZIP code',
      required: true,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: 'Two-letter country code (e.g., US, CA, GB)',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number',
      required: false,
    }),
  };
};

export const findOrCreateCustomerAddress = createAction({
  auth: bigcommerceAuth,
  name: 'find_or_create_customer_address',
  displayName: 'Find or Create Customer Address',
  description: 'Finds an existing customer address or creates a new one if not found',
  props: {
    customerId: customerIdDropdown,
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'Primary address line to search for',
      required: true,
    }),
    addressFields: Property.DynamicProperties({
      displayName: 'Address Fields (for creation)',
      description: 'Address information to use if creating a new address',
      required: true,
      refreshers: [],
      props: async () => {
        return getAddressFields();
      },
    }),
  },
  async run(context) {
    const { customerId, address1, addressFields } = context.propsValue;

    if (!customerId || !address1 || !addressFields || typeof addressFields !== 'object') {
      throw new Error('Customer ID, address line 1, and address fields are required');
    }

    const { city, state_or_province, postal_code, country_code } = addressFields as any;

    if (!city || !state_or_province || !postal_code || !country_code) {
      throw new Error('City, state/province, postal code, and country code are required for address creation');
    }

    try {
      const searchResponse = await sendBigCommerceRequest({
        auth: context.auth,
        url: `/customers/${customerId}/addresses`,
        method: HttpMethod.GET,
      });

      const existingAddresses = (searchResponse.body as { data: any[] }).data || [];
      const foundAddress = existingAddresses.find((addr: any) => 
        addr.address1 && addr.address1.toLowerCase() === address1.toLowerCase()
      );

      if (foundAddress) {
        return {
          success: true,
          found: true,
          message: `Address "${address1}" found for customer ${customerId}`,
          data: foundAddress,
        };
      }

      const addressData: any = { address1 };
      
      Object.entries(addressFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          addressData[key] = value;
        }
      });

      const createResponse = await sendBigCommerceRequest({
        auth: context.auth,
        url: `/customers/${customerId}/addresses`,
        method: HttpMethod.POST,
        body: addressData,
      });

      const address = (createResponse.body as { data: any }).data;

      return {
        success: true,
        found: false,
        message: `Address created successfully for customer ${customerId}`,
        data: address,
      };
    } catch (error) {
      throw handleBigCommerceError(error, 'Failed to find or create customer address');
    }
  },
});