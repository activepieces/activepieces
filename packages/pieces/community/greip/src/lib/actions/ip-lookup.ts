import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../common/auth';
import { greipApiCall } from '../common/client';

export const ipLookup = createAction({
  auth: greipAuth,
  name: 'ip_lookup',
  displayName: 'IP Lookup',
  description: 'Look up comprehensive information about an IP address including location, ISP, security, and risk factors',
  props: {
    ip: Property.ShortText({
      displayName: 'IP Address',
      description: 'The IP address to lookup (IPv4 or IPv6)',
      required: true,
    }),
    params: Property.ShortText({
      displayName: 'Modules',
      description: 'Comma-separated list of modules to include: security, currency, timezone, location (e.g., "security,timezone,currency")',
      required: false,
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
    lang: Property.StaticDropdown({
      displayName: 'Response Language',
      description: 'Language for the response',
      required: false,
      defaultValue: 'EN',
      options: {
        options: [
          { label: 'English', value: 'EN' },
          { label: 'Arabic', value: 'AR' },
          { label: 'German', value: 'DE' },
          { label: 'French', value: 'FR' },
          { label: 'Spanish', value: 'ES' },
          { label: 'Japanese', value: 'JA' },
          { label: 'Chinese', value: 'ZH' },
          { label: 'Russian', value: 'RU' },
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
    const { ip, params, format, lang, mode, userID, callback } = context.propsValue;

    const queryParams: Record<string, string> = {
      ip: ip,
    };

    if (params) {
      queryParams['params'] = params;
    }

    if (format) {
      queryParams['format'] = format;
    }

    if (lang) {
      queryParams['lang'] = lang;
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
      path: '/lookup/ip',
      queryParams,
      auth: context.auth,
    });
  },
});

