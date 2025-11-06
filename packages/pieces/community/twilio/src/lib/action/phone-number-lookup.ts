import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { twilioAuth } from '../..';

export const twilioPhoneNumberLookup = createAction({
  auth: twilioAuth,
  name: 'phone_number_lookup',
  description: 'Lookup information about a phone number.',
  displayName: 'Phone Number Lookup',
  props: {
    phone_number:Property.ShortText({
      displayName:'Phone Number',
      required:true
    })
  },
  async run(context) {
    const { phone_number } = context.propsValue;

    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    const response = await httpClient.sendRequest({
      method:HttpMethod.GET,
      url:`https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(phone_number)}`,
       authentication: {
            type: AuthenticationType.BASIC,
            username: account_sid,
            password: auth_token,
          },
        queryParams:{
          Fields:'line_type_intelligence'
        }
    })

    return response.body
  },
});