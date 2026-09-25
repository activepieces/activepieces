import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { plivoAuth } from '../..';

export const plivoLookupNumber = createAction({
  auth: plivoAuth,
  name: 'lookup_number',
  description: 'Look up carrier, country, and line type for a phone number',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a single phone number via the Plivo Lookup API and returns carrier name, country, line type as Plivo reports it, and formatted number variants. Use to validate or enrich a number before messaging or calling it. Read-only and idempotent.',
    idempotent: true,
  },
  displayName: 'Lookup Number',
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'The phone number to look up, in E.164 format (e.g., +15558675310).',
      required: true,
    }),
  },
  async run(context) {
    const { phone_number } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://lookup.plivo.com/v1/Number/${encodeURIComponent(phone_number.trim())}`,
      queryParams: { type: 'carrier' },
      authentication: {
        type: AuthenticationType.BASIC,
        username: context.auth.username,
        password: context.auth.password,
      },
    });
    return response.body;
  },
});
