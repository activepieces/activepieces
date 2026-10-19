import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooListTemplatesOutputSchema } from '../../output-schemas';

export const mailerooListTemplates = createAction({
  auth: mailerooAuth,
  name: 'maileroo_list_templates',
  outputSchema: mailerooListTemplatesOutputSchema,
  displayName: 'List Templates',
  description: 'Lists email templates.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the account\'s email templates with ID, name, type and preview URL, optionally filtered by name. The template ID is used by maileroo_send_bulk_emails and the template send action. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter by template name.',
      required: false,
    }),
  },
  async run(context) {
    const { search } = context.propsValue;
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/templates',
      queryParams: mailerooClient.toQuery({ search }),
    });
  },
});
