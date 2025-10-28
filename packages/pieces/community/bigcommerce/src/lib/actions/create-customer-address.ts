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
    country_code: Property.StaticDropdown({
      displayName: 'Country',
      description: 'Select country',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'United States', value: 'US' },
          { label: 'Canada', value: 'CA' },
          { label: 'United Kingdom', value: 'GB' },
          { label: 'Australia', value: 'AU' },
          { label: 'Germany', value: 'DE' },
          { label: 'France', value: 'FR' },
          { label: 'Italy', value: 'IT' },
          { label: 'Spain', value: 'ES' },
          { label: 'Netherlands', value: 'NL' },
          { label: 'Belgium', value: 'BE' },
          { label: 'Switzerland', value: 'CH' },
          { label: 'Austria', value: 'AT' },
          { label: 'Sweden', value: 'SE' },
          { label: 'Norway', value: 'NO' },
          { label: 'Denmark', value: 'DK' },
          { label: 'Finland', value: 'FI' },
          { label: 'Japan', value: 'JP' },
          { label: 'South Korea', value: 'KR' },
          { label: 'Singapore', value: 'SG' },
          { label: 'Hong Kong', value: 'HK' },
          { label: 'New Zealand', value: 'NZ' },
          { label: 'Brazil', value: 'BR' },
          { label: 'Mexico', value: 'MX' },
          { label: 'India', value: 'IN' },
          { label: 'China', value: 'CN' },
        ],
      },
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
    form_fields: Property.LongText({
      displayName: 'Form Fields',
      description: 'JSON string of additional form fields (optional)',
      required: false,
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

    const { address1, city, state_or_province, postal_code, country_code, form_fields } = addressFields as any;

    // Validate required fields according to BigCommerce API
    if (!address1 || typeof address1 !== 'string' || address1.trim().length === 0) {
      throw new Error('Address line 1 is required and cannot be empty');
    }

    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      throw new Error('City is required and cannot be empty');
    }

    if (!state_or_province || typeof state_or_province !== 'string' || state_or_province.trim().length === 0) {
      throw new Error('State/Province is required and cannot be empty');
    }

    if (!postal_code || typeof postal_code !== 'string' || postal_code.trim().length === 0) {
      throw new Error('Postal code is required and cannot be empty');
    }

    if (!country_code || typeof country_code !== 'string' || country_code.trim().length === 0) {
      throw new Error('Country code is required and cannot be empty');
    }

    try {
      const addressData: any = {
        address1: address1.trim(),
        city: city.trim(),
        state_or_province: state_or_province.trim(),
        postal_code: postal_code.trim(),
        country_code: country_code.trim().toUpperCase(),
      };
      
      // Add optional fields if provided
      const optionalFields = [
        'first_name', 'last_name', 'company', 'address2', 'phone', 'address_type'
      ];

      optionalFields.forEach(field => {
        const value = (addressFields as any)[field];
        if (value !== undefined && value !== null && value !== '') {
          addressData[field] = field === 'country_code' ? value.toUpperCase() : value;
        }
      });

      // Handle form_fields as JSON
      if (form_fields && typeof form_fields === 'string') {
        try {
          addressData.form_fields = JSON.parse(form_fields);
        } catch (error) {
          throw new Error('Form fields must be valid JSON');
        }
      }

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