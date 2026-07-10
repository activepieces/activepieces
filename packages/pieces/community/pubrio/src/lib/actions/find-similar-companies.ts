import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const findSimilarCompanies = createAction({
  auth: pubrioAuth,
  name: 'find_similar_companies',
  displayName: 'Find Similar Companies',
  description:
    'Find companies similar to a given company by domain or LinkedIn URL',
  audience: 'both',
  aiMetadata: {
    description:
      'Return a paged list of companies that resemble one seed company, identified via lookup_type (domain or LinkedIn URL). Read-only and repeatable (per_page max 25). Use for lookalike prospecting from a known account; to enrich that one seed company instead use Lookup Company.',
    idempotent: true,
  },
  props: {
    lookup_type: Property.StaticDropdown({
      displayName: 'Lookup Type',
      required: true,
      options: {
        options: [
          { label: 'Domain', value: 'domain' },
          { label: 'LinkedIn URL', value: 'linkedin_url' },
        ],
      },
    }),
    value: Property.ShortText({ displayName: 'Value', required: true }),
    page: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 1,
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: 'Max 25',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      [context.propsValue.lookup_type]: context.propsValue.value,
      page: context.propsValue.page ?? 1,
      per_page: context.propsValue.per_page ?? 25,
    };
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/companies/lookalikes/search',
      body
    );
  },
});
