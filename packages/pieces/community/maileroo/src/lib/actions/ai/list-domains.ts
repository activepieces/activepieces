import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooListDomainsOutputSchema } from '../../output-schemas';

export const mailerooListDomains = createAction({
  auth: mailerooAuth,
  name: 'maileroo_list_domains',
  outputSchema: mailerooListDomainsOutputSchema,
  displayName: 'List Domains',
  description: 'Lists the account\'s domains with basic statistics.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists domains with their ID, name, DNS verification status and delivered, bounced, opened and clicked counts; this is the source of the domain_id used by every domain action. Supports search by name, sorting and paging. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter domains by name.',
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
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'ID', value: 'id' },
          { label: 'Domain name', value: 'domain_name' },
          { label: 'Delivered', value: 'delivered' },
          { label: 'Bounced', value: 'bounced' },
          { label: 'Opened', value: 'opened' },
          { label: 'Clicked', value: 'clicked' },
        ],
      },
    }),
    sort_dir: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'Sort direction.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
  },
  async run(context) {
    const { search, page, per_page, sort_by, sort_dir } = context.propsValue;
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/domains',
      queryParams: mailerooClient.toQuery({ search, page, per_page, sort_by, sort_dir }),
    });
  },
});
