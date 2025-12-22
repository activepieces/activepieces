import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { clearoutphoneAuth } from '../common/auth';

export const findPhoneNumberIsMobile = createAction({
  auth: clearoutphoneAuth,
  name: 'findPhoneNumberIsMobile',
  displayName: 'Find Phone Number Is Mobile',
  description:
    'Determine if a phone number is a mobile number using ClearoutPhone API',
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

    const result = response.body as {
      status: string;
      data?: {
        line_type?: string;
        carrier?: string;
        location?: string;
        country_name?: string;
        country_code?: string;
        status?: string;
      };
    };

    if (result.status === 'success' && result.data?.line_type) {
      const lineType = result.data.line_type.toUpperCase();
      const isMobile = lineType === 'MOBILE';

      return {
        isMobile,
        lineType: result.data.line_type,
        carrier: result.data.carrier,
        location: result.data.location,
        countryName: result.data.country_name,
        countryCode: result.data.country_code,
        status: result.data.status,
      };
    }

    return {
      isMobile: false,
      response: result,
    };
  },
});
