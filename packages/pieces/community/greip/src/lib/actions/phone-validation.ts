import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../common/auth';
import { greipApiCall } from '../common/client';

export const phoneValidation = createAction({
  auth: greipAuth,
  name: 'phone_validation',
  displayName: 'Phone Validation',
  description: 'Validate phone numbers by checking syntax and assessing validity and operational status',
  props: {
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to validate (e.g., +12121234567, 0012121234567, 12121234567, or 2121234567)',
      required: true,
    }),
    countryCode: Property.ShortText({
      displayName: 'Country Code',
      description: 'ISO 3166-1 alpha-2 country code (e.g., US, GB, FR)',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'Format of the response',
      required: false,
      defaultValue: 'JSON',
      options: {
        options: [
          { label: 'JSON', value: 'JSON' },
          { label: 'XML', value: 'XML' },
          { label: 'CSV', value: 'CSV' },
          { label: 'Newline', value: 'Newline' },
        ],
      },
    }),
    mode: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Environment mode for testing or production',
      required: false,
      defaultValue: 'live',
      options: {
        options: [
          { label: 'Live', value: 'live' },
          { label: 'Test', value: 'test' },
        ],
      },
    }),
    userID: Property.ShortText({
      displayName: 'User Identifier',
      description: 'Identify requests from specific users for monitoring (e.g., email, phone, user ID)',
      required: false,
    }),
    callback: Property.ShortText({
      displayName: 'JSONP Callback',
      description: 'Function name for JSONP response format',
      required: false,
    }),
  },
  async run(context) {
    const { phone, countryCode, format, mode, userID, callback } = context.propsValue;

    const queryParams: Record<string, string> = {
      phone: phone,
      countryCode: countryCode,
    };

    if (format) {
      queryParams['format'] = format;
    }

    if (mode) {
      queryParams['mode'] = mode;
    }

    if (userID) {
      queryParams['userID'] = userID;
    }

    if (callback) {
      queryParams['callback'] = callback;
    }

    return await greipApiCall({
      method: HttpMethod.GET,
      path: '/scoring/phone',
      queryParams,
      auth: context.auth,
    });
  },
});

