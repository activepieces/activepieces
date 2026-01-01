import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { clearoutphoneAuth } from '../common/auth';

export const validatePhoneNumber = createAction({
  auth: clearoutphoneAuth,
  name: 'validatePhoneNumber',
  displayName: 'Validate Phone Number',
  description:
    'Validate a phone number and retrieve comprehensive information using ClearoutPhone API',
  props: {
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to validate (e.g., +447766733573 )',
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

    if (result.status === 'success' && result.data) {
      return {
        isValid: result.data.status === 'valid',
        status: result.data.status,
        lineType: result.data.line_type,
        carrier: result.data.carrier,
        location: result.data.location,
        countryName: result.data.country_name,
        countryTimezone: result.data.country_timezone,
        countryUtcOffset: result.data.country_utcoffset,
        countryDstObservedHours: result.data.country_dstobservedhrs,
        countryCode: result.data.country_code,
        internationalFormat: result.data.international_format,
        localFormat: result.data.local_format,
        e164Format: result.data.e164_format,
        canBeInternationallyDialled: result.data.can_be_internationally_dialled,
        validatedOn: result.data.validated_on,
        timeTaken: result.data.time_taken,
      };
    }

    return result;
  },
});
