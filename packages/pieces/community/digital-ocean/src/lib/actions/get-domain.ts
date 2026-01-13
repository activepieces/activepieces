import { createAction, Property } from '@activepieces/pieces-framework';
import { digitalOceanAuth, DigitalOceanAuthValue } from '../common/auth';
import { digitalOceanApiCall, getAuthFromValue } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getDomain = createAction({
  auth: digitalOceanAuth,
  name: 'get_domain',
  displayName: 'Get Domain',
  description: 'Retrieve details about a specific domain.',
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
