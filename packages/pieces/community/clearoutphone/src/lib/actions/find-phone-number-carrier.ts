import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { clearoutphoneAuth } from '../common/auth';

export const findPhoneNumberCarrier = createAction({
  auth: clearoutphoneAuth,
  name: 'findPhoneNumberCarrier',
  displayName: 'Find Phone Number Carrier',
  description: 'Find the carrier of a phone number using ClearoutPhone API',
  props: {
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'The phone number to validate (e.g., +447766733573 )',
      required: true,
    }),
    
  },
  async run({ auth, propsValue }) {
    const headers: Record<string, string> = {
      Authorization: `Bearer:${auth.secret_text}`,
      'Content-Type': 'application/json',
    };

    const body: any = {
      number: propsValue.phoneNumber,
    };


    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.clearoutphone.io/v1/phonenumber/validate',
      headers,
      body,
    });

    const result = response.body as any;

    if (result.status === 'success' && result.data?.carrier) {
      return {
        carrier: result.data.carrier,
        lineType: result.data.line_type,
        location: result.data.location,
        countryName: result.data.country_name,
        countryCode: result.data.country_code,
        status: result.data.status,
      };
    }

    return {
      carrier: null,
      response: result,
    };
  },
});
