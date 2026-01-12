import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../common/auth';
import { greipApiCall } from '../common/client';

export const binLookup = createAction({
  auth: greipAuth,
  name: 'bin_lookup',
  displayName: 'BIN Lookup',
  description: 'Look up details of a Bank Identification Number (BIN) or Issuer Identification Number (IIN)',
  props: {
    bin: Property.ShortText({
      displayName: 'BIN/IIN',
      description: 'The BIN/IIN of the card (minimum 6 digits). Can be partial like "456789" or full card number',
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
    const { bin, format, mode, userID, callback } = context.propsValue;

    const queryParams: Record<string, string> = {
      bin: bin,
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
      path: '/lookup/bin',
      queryParams,
      auth: context.auth,
    });
  },
});

