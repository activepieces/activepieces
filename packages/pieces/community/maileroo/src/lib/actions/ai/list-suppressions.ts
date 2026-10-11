import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooListSuppressionsOutputSchema } from '../../output-schemas';

export const mailerooListSuppressions = createAction({
  auth: mailerooAuth,
  name: 'maileroo_list_suppressions',
  outputSchema: mailerooListSuppressionsOutputSchema,
  displayName: 'List Suppressions',
  description: 'Lists suppressed email addresses.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists addresses that Maileroo will not send to, with ID and reason, searchable by address and paged. Use before a send to check whether a recipient is blocked. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter by email address.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: 'Items per page (10 to 100).',
      required: false,
    }),
  },
  async run(context) {
    const { search, page, per_page } = context.propsValue;
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/suppressions',
      queryParams: mailerooClient.toQuery({ search, page, per_page }),
    });
  },
});
