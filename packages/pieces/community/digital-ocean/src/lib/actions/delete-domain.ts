import { createAction, Property } from '@activepieces/pieces-framework';
import { digitalOceanAuth, DigitalOceanAuthValue } from '../common/auth';
import { digitalOceanApiCall, getAuthFromValue } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteDomain = createAction({
  auth: digitalOceanAuth,
  name: 'delete_domain',
  displayName: 'Delete Domain',
  description: 'Remove a domain from your DigitalOcean account.',
  props: {
    domain_name: Property.ShortText({
      displayName: 'Domain Name',
      description: 'The domain name to delete (e.g., example.com).',
      required: true,
    }),
  },
  async run(context) {
    const { domain_name } = context.propsValue;

    await digitalOceanApiCall<void>({
      method: HttpMethod.DELETE,
      path: `/domains/${encodeURIComponent(domain_name)}`,
      auth: getAuthFromValue(context.auth as DigitalOceanAuthValue),
    });

    return {
      success: true,
      message: `Domain '${domain_name}' has been deleted.`,
    };
  },
});
