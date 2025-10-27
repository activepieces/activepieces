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
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'Primary address line',
      required: true,
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
    address_type: Property.StaticDropdown({
      displayName: 'Address Type',
      description: 'Type of address',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Residential', value: 'residential' },
          { label: 'Commercial', value: 'commercial' },
        ],
      },
    }),
  };
};

export const createCustomerAddress = createAction({
  auth: bigcommerceAuth,
  name: 'create_customer_address',
  displayName: 'Create Customer Address',
  description: 'Creates a new address for a customer in BigCommerce',
  props: {
    customerId: customerIdDropdown,
    addressFields: Property.DynamicProperties({
      displayName: 'Address Fields',
      description: 'Address information',
      required: true,
      refreshers: [],
      props: async () => {
        return getAddressFields();
      },
    }),
  },
  async run(context) {
    const { customerId, addressFields } = context.propsValue;

    if (!customerId || !addressFields || typeof addressFields !== 'object') {
      throw new Error('Customer ID and address fields are required');
    }

    const { address1, city, state_or_province, postal_code, country_code } = addressFields as any;

    if (!address1 || !city || !state_or_province || !postal_code || !country_code) {
      throw new Error('Address line 1, city, state/province, postal code, and country code are required');
    }

    try {
      const addressData: any = {};
      
      Object.entries(addressFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          addressData[key] = value;
        }
      });

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: `/customers/${customerId}/addresses`,
        method: HttpMethod.POST,
        body: addressData,
      });

      const address = (response.body as { data: any }).data;

      return {
        success: true,
        message: `Address created successfully for customer ${customerId}`,
        data: address,
      };
    } catch (error) {
      throw handleBigCommerceError(error, 'Failed to create customer address');
    }
  },
});