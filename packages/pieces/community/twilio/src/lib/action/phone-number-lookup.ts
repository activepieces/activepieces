import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { twilioAuth } from '../..';

export const twilioPhoneNumberLookup = createAction({
  auth: twilioAuth,
  name: 'phone_number_lookup',
  description: 'Lookup detailed information about a phone number including carrier, caller name, and add-on data',
  displayName: 'Phone Number Lookup',
  props: {
    phone_number: Property.ShortText({
      description: 'The phone number to lookup (E.164 format recommended, e.g., +1234567890)',
      displayName: 'Phone Number',
      required: true,
    }),
    country_code: Property.ShortText({
      description: 'ISO country code (required only if phone number is in national format, e.g., "US")',
      displayName: 'Country Code',
      required: false,
    }),
    include_carrier_info: Property.Checkbox({
      description: 'Include carrier information (network operator, line type)',
      displayName: 'Include Carrier Info',
      required: false,
      defaultValue: true,
    }),
    include_caller_name: Property.Checkbox({
      description: 'Include caller name information (if available)',
      displayName: 'Include Caller Name',
      required: false,
      defaultValue: false,
    }),
    add_ons: Property.Array({
      description: 'Add-ons to invoke for additional data (specify unique_name of installed add-ons)',
      displayName: 'Add-ons',
      required: false,
      properties: {
        unique_name: Property.ShortText({
          displayName: 'Add-on Unique Name',
          description: 'The unique name of the add-on (e.g., "whitepages_pro_caller_id")',
          required: true,
        }),
        data: Property.LongText({
          displayName: 'Add-on Data',
          description: 'Optional data to pass to the add-on (JSON format)',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const { 
      phone_number, 
      country_code, 
      include_carrier_info = true, 
      include_caller_name = false,
      add_ons = []
    } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    
    const queryParams = new URLSearchParams();
    
    if (country_code) {
      queryParams.append('CountryCode', country_code);
    }
    const types = [];
    if (include_carrier_info) {
      types.push('carrier');
    }
    if (include_caller_name) {
      types.push('caller-name');
    }
    
    types.forEach(type => {
      queryParams.append('Type', type);
    });
    if (add_ons && add_ons.length > 0) {
      add_ons.forEach((addon: any) => {
        if (addon.unique_name) {
          queryParams.append('AddOns', addon.unique_name);
          if (addon.data) {
            try {
              const parsedData = typeof addon.data === 'string' ? JSON.parse(addon.data) : addon.data;
              queryParams.append(`AddOns.${addon.unique_name}.data`, JSON.stringify(parsedData));
            } catch (error) {
              console.warn(`Invalid JSON in add-on data for ${addon.unique_name}:`, error);
            }
          }
        }
      });
    }
    
    const url = `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(phone_number)}?${queryParams.toString()}`;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url,
      authentication: {
        type: AuthenticationType.BASIC,
        username: account_sid,
        password: auth_token,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = response.body as any;
    
    return {
      lookup_result: result,
      requested_types: types,
      requested_addons: add_ons?.map((addon: any) => addon.unique_name) || [],
      formatted_number: result.phone_number,
      is_valid: !!result.phone_number,
      query_url: url.replace(/\/\/[^@]*@/, '//***:***@'),
    };
  },
});
