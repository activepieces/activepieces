import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooInboundRouteOutputSchema } from '../../output-schemas';

export const mailerooGetInboundRoute = createAction({
  auth: mailerooAuth,
  name: 'maileroo_get_inbound_route',
  outputSchema: mailerooInboundRouteOutputSchema,
  displayName: 'Get Inbound Route',
  description: 'Gets one inbound route.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns a single inbound route of a domain. Get the route ID from maileroo_list_inbound_routes. Requires an Account Key connection.',
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
      method: HttpMethod.GET,
      path: `/domains/${encodeURIComponent(domain_id)}/inbound-routes/${encodeURIComponent(route_id)}`,
    });
  },
});
