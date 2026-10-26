import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { apiverveAuth } from '../auth';
import { apiverveCommon } from '../common';

export const lookupIpAddressAction = createAction({
  auth: apiverveAuth,
  name: 'lookup_ip_address',
  classification: 'READ',
  displayName: 'Look Up IP Address',
  description:
    'Get the country, region, city, timezone and network owner of an IP address.',
  audience: 'both',
  aiMetadata: {
    description:
      'Geolocate one IPv4 or IPv6 address and return its country, region, city, timezone and network owner. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ip: Property.ShortText({
      displayName: 'IP Address',
      description: 'The IPv4 or IPv6 address to look up, for example 8.8.8.8.',
      required: true,
    }),
  },
  async run(context) {
    return apiverveCommon.callApiverve({
      apiKey: context.auth.secret_text,
      path: '/v1/iplookup',
      method: HttpMethod.GET,
      query: apiverveCommon.toQuery({ ip: context.propsValue.ip }),
    });
  },
});
