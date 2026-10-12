import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooListInboundRoutesOutputSchema } from '../../output-schemas';

export const mailerooListInboundRoutes = createAction({
  auth: mailerooAuth,
  name: 'maileroo_list_inbound_routes',
  outputSchema: mailerooListInboundRoutesOutputSchema,
  displayName: 'List Inbound Routes',
  description: 'Lists a domain\'s inbound routes.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the inbound routing rules of a domain sorted by priority, 10 per page, with their match type, forward targets and flags. Supports a text search over description, recipient, header and expression. Get the domain_id from maileroo_list_domains. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    domain_id: Property.Number({
      displayName: 'Domain ID',
      description: 'Numeric domain ID. Get it from maileroo_list_domains.',
      required: true,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Matches description, recipient, header or expression.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
    }),
  },
  async run(context) {
    const { domain_id, search, page } = context.propsValue;
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/domains/${encodeURIComponent(domain_id)}/inbound-routes`,
      queryParams: mailerooClient.toQuery({ search, page }),
    });
  },
});
