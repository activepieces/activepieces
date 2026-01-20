import { createAction, Property } from '@activepieces/pieces-framework';
import { digitalOceanAuth, DigitalOceanAuthValue } from '../common/auth';
import { digitalOceanApiCall, getAuthFromValue } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createDomain = createAction({
  auth: digitalOceanAuth,
  name: 'create_domain',
  displayName: 'Create Domain',
  description: 'Add a new domain to your DigitalOcean account.',
  props: {
    name: Property.ShortText({
      displayName: 'Domain Name',
      description: 'The domain name (e.g., example.com).',
      required: true,
    }),
    ip_address: Property.ShortText({
      displayName: 'IP Address',
      description: 'Optional IP address to create an A record pointing to the apex domain.',
      required: false,
    }),
  },
  async run(context) {
    const { name, ip_address } = context.propsValue;

    const body: { name: string; ip_address?: string } = { name };
    if (ip_address) {
      body.ip_address = ip_address;
    }

    const response = await digitalOceanApiCall<{
      domain: {
        name: string;
        ttl: number;
        zone_file: string | null;
      };
    }>({
      method: HttpMethod.POST,
      path: '/domains',
      auth: getAuthFromValue(context.auth as DigitalOceanAuthValue),
      body,
    });

    return response;
  },
});
