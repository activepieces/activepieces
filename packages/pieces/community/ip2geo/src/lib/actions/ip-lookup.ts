import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ip2geoAuth } from '../common/auth';
import { ip2geoApiCall } from '../common/client';

export const ipLookup = createAction({
  auth: ip2geoAuth,
  name: 'ip_lookup',
  displayName: 'IP Lookup',
  description:
    'Convert an IP address into geolocation data including city, country, timezone, ASN, and currency',
  props: {
    ip: Property.ShortText({
      displayName: 'IP Address',
      description: 'The IP address to look up (IPv4 or IPv6)',
      required: true,
    }),
  },
  async run(context) {
    const { ip } = context.propsValue;

    return await ip2geoApiCall({
      method: HttpMethod.GET,
      path: '/convert',
      queryParams: {
        ip,
      },
      auth: context.auth,
    });
  },
});
