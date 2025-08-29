import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { twilioAuth } from '../..';

export const twilioPhoneNumberLookup = createAction({
  auth: twilioAuth,
  name: 'phone_number_lookup',
  displayName: 'Phone Number Lookup',
  description: 'Lookup information about a phone number',
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to lookup (in E.164 format, e.g., +1234567890)',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Lookup Type',
      description: 'The type of information to lookup',
      required: false,
      defaultValue: 'carrier',
      options: {
        disabled: false,
        options: [
          { label: 'Carrier', value: 'carrier' },
          { label: 'Caller Name', value: 'caller-name' },
        ],
      },
    }),
  },
  async run(context) {
    const { phone_number, type = 'carrier' } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    // Remove any non-digit characters except + for E.164 format
    const cleanPhoneNumber = phone_number.replace(/[^\d+]/g, '');
    
    const url = `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(cleanPhoneNumber)}?Type=${type}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url,
      authentication: {
        type: AuthenticationType.BASIC,
        username: account_sid,
        password: auth_token,
      },
    });

    return response.body;
  },
});
