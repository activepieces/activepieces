import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const findSimilarCompaniesAi = createAction({
  auth: pubrioAuth,
  name: 'find_similar_companies_ai',
  displayName: 'Find Similar Companies',
  description: 'Find companies resembling one seed company',
  audience: 'ai',
  aiMetadata: {
    description:
      'Find companies resembling one seed company (by domain or LinkedIn URL); returns a paged list (max 25/page). Read-only and repeatable. Pick this for lookalike/competitor prospecting from a known account; use Find Companies for criteria-based discovery or Enrich Company Profile for one firm\'s detail.',
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
