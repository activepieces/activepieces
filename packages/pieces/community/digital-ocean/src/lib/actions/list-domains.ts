import { createAction, Property } from '@activepieces/pieces-framework';
import { digitalOceanAuth, DigitalOceanAuthValue } from '../common/auth';
import { digitalOceanApiCall, getAuthFromValue } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const listDomains = createAction({
  auth: digitalOceanAuth,
  name: 'list_domains',
  displayName: 'List All Domains',
  description: 'Retrieve a list of all domains in your account.',
  props: {
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of domains to return per page (1-200).',
      required: false,
      defaultValue: 20,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Which page of results to return.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const { per_page, page } = context.propsValue;

    const response = await digitalOceanApiCall<{
      domains: Array<{
        name: string;
        ttl: number;
        zone_file: string | null;
      }>;
      links: object;
      meta: { total: number };
    }>({
      method: HttpMethod.GET,
      path: '/domains',
      auth: getAuthFromValue(context.auth as DigitalOceanAuthValue),
      query: {
        per_page: per_page ?? 20,
        page: page ?? 1,
      },
    });

    return response;
  },
});
