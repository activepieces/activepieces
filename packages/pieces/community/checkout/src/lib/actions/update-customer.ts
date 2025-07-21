import { createAction, Property } from '@activepieces/pieces-framework';
import { checkoutComAuth, getEnvironmentFromApiKey } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateCustomerAction = createAction({
  name: 'update_customer',
  auth: checkoutComAuth,
  displayName: 'Update Customer',
  description: 'Update existing customer or their metadata.',
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The ID of the customer to update (e.g., cus_y3oqhf46pyzuxjocn2giaqnb44)',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The customer\'s email address',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The customer\'s name',
      required: false,
    }),
    phone_country_code: Property.ShortText({
      displayName: 'Phone Country Code',
      description: 'The international country calling code (e.g., +1, +44). Required if phone number is provided.',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number (6-25 characters). Required if country code is provided.',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Additional information about the customer. Will replace any existing metadata.',
      required: false,
    }),
    default: Property.ShortText({
      displayName: 'Default Instrument ID',
      description: 'The ID of this customer\'s default instrument',
      required: false,
    }),
  },
  async run(context) {
    const { customerId, email, name, phone_country_code, phone_number, metadata, default: defaultInstrument } = context.propsValue;
    
    const { baseUrl } = getEnvironmentFromApiKey(context.auth);
    
    const body: Record<string, any> = {};
    
    if (email) {
      body['email'] = email;
    }
    
    if (name) {
      body['name'] = name;
    }
    
    if (phone_country_code || phone_number) {
      if (!phone_country_code || !phone_number) {
        throw new Error('Both phone country code and phone number are required when providing phone information');
      }
      
      if (phone_country_code.length < 1 || phone_country_code.length > 7) {
        throw new Error('Country code must be between 1 and 7 characters');
      }
      
      if (phone_number.length < 6 || phone_number.length > 25) {
        throw new Error('Phone number must be between 6 and 25 characters');
      }
      
      body['phone'] = {
        country_code: phone_country_code,
        number: phone_number,
      };
    }
    
    if (metadata) {
      const metadataKeys = Object.keys(metadata);
      if (metadataKeys.length > 10) {
        throw new Error('Metadata can have a maximum of 10 key-value pairs');
      }
      
      for (const [key, value] of Object.entries(metadata)) {
        if (key.length > 100) {
          throw new Error(`Metadata key "${key}" exceeds 100 characters`);
        }
        if (typeof value === 'string' && value.length > 100) {
          throw new Error(`Metadata value for key "${key}" exceeds 100 characters`);
        }
      }
      
      body['metadata'] = metadata;
    }
    
    if (defaultInstrument) {
      body['default'] = defaultInstrument;
    }
    
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PATCH,
        url: `${baseUrl}/customers/${customerId}`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
        body,
      });
      
      return response.body;
    } catch (error: any) {
      if (error.response?.status === 422) {
        throw new Error(`Invalid data: ${error.response.body?.error_codes?.join(', ') || 'Please check your input data'}`);
      }
      throw error;
    }
  },
}); 