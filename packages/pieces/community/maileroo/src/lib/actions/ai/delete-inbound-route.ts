import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooSuccessOutputSchema } from '../../output-schemas';

export const mailerooDeleteInboundRoute = createAction({
  auth: mailerooAuth,
  outputSchema: mailerooSuccessOutputSchema,
  name: 'maileroo_delete_inbound_route',
  displayName: 'Delete Inbound Route',
  description: 'Deletes an inbound route.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes an inbound route of a domain; mail it matched is no longer forwarded. Get the route ID from maileroo_list_inbound_routes. Hard delete. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    domain_id: Property.Number({
      displayName: 'Domain ID',
      description: 'Numeric domain ID. Get it from maileroo_list_domains.',
      required: true,
    }),
    route_id: Property.ShortText({
      displayName: 'Route ID',
      description: 'Route ID from maileroo_list_inbound_routes.',
      required: true,
    }),
  },
  async run(context) {
    const { domain_id, route_id } = context.propsValue;
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/domains/${encodeURIComponent(domain_id)}/inbound-routes/${encodeURIComponent(route_id)}`,
    });
  },
});
