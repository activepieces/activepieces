import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiApiCall } from '../common/client';
import { retellAiAuth } from '../common/auth';

export const getPhoneNumber = createAction({
  auth: retellAiAuth,
  name: 'get_phone_number',
  displayName: 'Get Phone Number',
  description: 'Retrieve full details for an existing phone number in Retell AI.',
  props: {
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'E.164 format of the number (+country code, then number with no space, no special characters), used as the unique identifier for phone number APIs. Example: "+14157774444"',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { phoneNumber } = propsValue;

    // Validate phone number format
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(phoneNumber)) {
      throw new Error('Phone Number must be in E.164 format (e.g., +14157774444)');
    }

    return await retellAiApiCall({
      method: HttpMethod.GET,
      url: `/get-phone-number/${encodeURIComponent(phoneNumber)}`,
      auth: auth,
    });
  },
});