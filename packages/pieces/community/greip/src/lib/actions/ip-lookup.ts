import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../auth';
import { greipClient } from '../common/client';
import { greipProps } from '../common/props';
import { ipLookupOutputSchema } from '../output-schemas';

export const ipLookupAction = createAction({
  auth: greipAuth,
  name: 'ip_lookup',
  outputSchema: ipLookupOutputSchema,
  classification: 'READ',
  displayName: 'IP Lookup',
  description: 'Look up comprehensive information about an IP address including location, ISP, security, and risk factors',
  audience: 'human',
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
    format: greipProps.format({ required: false }),
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
    mode: greipProps.mode({ required: false }),
    userID: greipProps.userID({ required: false }),
    callback: greipProps.callback({ required: false }),
  },
  async run(context) {
    const { ip, params, format, lang, mode, userID, callback } = context.propsValue;

    const queryParams: Record<string, string> = {};

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
      queryParams['user_id'] = userID;
    }

    if (callback) {
      queryParams['callback'] = callback;
    }

    return await greipClient.request({
      method: HttpMethod.GET,
      path: `/lookup/ip/${encodeURIComponent(ip)}`,
      query: queryParams,
      auth: context.auth,
    });
  },
});

