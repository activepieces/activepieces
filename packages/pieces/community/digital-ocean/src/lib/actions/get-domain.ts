import { createAction, Property } from '@activepieces/pieces-framework';
import { digitalOceanAuth, DigitalOceanAuthValue } from '../common/auth';
import { digitalOceanApiCall, getAuthFromValue } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getDomain = createAction({
  auth: digitalOceanAuth,
  name: 'get_domain',
  displayName: 'Get Domain',
  description: 'Retrieve details about a specific domain.',
  audience: 'both',
  aiMetadata: { description: 'Fetches details for a single DNS domain on the DigitalOcean account, identified by its exact domain name. Use when you already know the domain name and need its TTL or zone file. Read-only and idempotent.', idempotent: true },
  props: {
    domain_name: Property.ShortText({
      displayName: 'Domain Name',
      description: 'The domain name to retrieve (e.g., example.com).',
      required: true,
    }),
  },
  async run(context) {
    const { domain_name } = context.propsValue;

    const response = await digitalOceanApiCall<{
      domain: {
        name: string;
        ttl: number;
        zone_file: string;
      };
    }>({
      method: HttpMethod.GET,
      path: `/domains/${encodeURIComponent(domain_name)}`,
      auth: getAuthFromValue(context.auth as DigitalOceanAuthValue),
    });

    return response;
  },
});
