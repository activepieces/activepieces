import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { plivoAuth } from '../..';

export const plivoNumberLookup = createAction({
  auth: plivoAuth,
  name: 'number_lookup',
  description: 'Look up carrier and formatting details for a phone number.',
  audience: 'both',
  aiMetadata: { description: 'Looks up country, formatting, and carrier details for a single phone number via the Plivo Lookup API. Use to validate or enrich a number (e.g. detect mobile vs landline, carrier) before messaging or calling it. Read-only and idempotent.', idempotent: true },
  displayName: 'Number Lookup',
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to look up, in E.164 format (e.g., +15558675310).',
      required: true,
    }),
  },
  async run(context) {
    const { phone_number } = context.propsValue;
    const auth_id = context.auth.username;
    const auth_token = context.auth.password;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://lookup.plivo.com/v1/Number/${encodeURIComponent(phone_number)}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth_id,
        password: auth_token,
      },
      queryParams: {
        type: 'carrier',
      },
    });

    return response.body;
  },
});
