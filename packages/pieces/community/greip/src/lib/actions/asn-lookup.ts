import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../common/auth';
import { greipApiCall } from '../common/client';

export const asnLookup = createAction({
  auth: greipAuth,
  name: 'asn_lookup',
  displayName: 'ASN Lookup',
  description: 'Look up details of an Autonomous System Number (ASN)',
  props: {
    asn: Property.ShortText({
      displayName: 'AS Number',
      description: 'The AS Number to lookup (e.g., AS6167 or 6167)',
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
    callback: Property.ShortText({
      displayName: 'JSONP Callback',
      description: 'Function name for JSONP response format',
      required: false,
    }),
  },
  async run(context) {
    const { asn, format, mode, callback } = context.propsValue;

    const queryParams: Record<string, string> = {
      asn: asn,
    };

    if (format) {
      queryParams['format'] = format;
    }

    if (mode) {
      queryParams['mode'] = mode;
    }

    if (callback) {
      queryParams['callback'] = callback;
    }

    return await greipApiCall({
      method: HttpMethod.GET,
      path: '/lookup/asn',
      queryParams,
      auth: context.auth,
    });
  },
});

