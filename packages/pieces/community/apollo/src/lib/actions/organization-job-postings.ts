import { Property, StoreScope, createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { apiKeyOf, recordsOf } from '../common/client';
import { apolloInputs } from '../common/ai-props';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloRequests } from '../common/requests';

export const organizationJobPostings = createAction({
  auth: apolloAuth,
  name: 'organizationJobPostings',
  classification: 'SEARCH',
  displayName: 'Organization Job Postings',
  description: 'Retrieve current job postings for a company to identify growing headcount areas. Uses 1 Apollo credit per page.',
  audience: 'human',
  aiMetadata: {
    description:
      'Returns one page of the current job postings for one Apollo organization ID as a list. Uses 1 Apollo credit per page.',
    idempotent: true,
  },
  props: {
    organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The Apollo ID of the organization to get job postings for',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1 (default 1). Each page uses 1 credit.',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Results per page, 1-10000. Leave empty for the Apollo default.',
      required: false,
    }),
    cacheResponse: Property.Checkbox({
      displayName: 'Cache Response',
      description: 'Store the response in the project store for future use.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: apolloOutputSchemas.rawJobPostings,
  async run({ propsValue, auth, store }) {
    const organizationId = apolloInputs.requireText({ value: propsValue.organization_id, label: 'Organization ID' });
    const page = apolloInputs.optionalInteger({ value: propsValue.page, label: 'Page', min: 1, max: 500 });
    const perPage = apolloInputs.optionalInteger({ value: propsValue.per_page, label: 'Results Per Page', min: 1, max: 10000 });
    const pageSuffix = page === undefined && perPage === undefined ? '' : `_${page ?? ''}_${perPage ?? ''}`;
    const cacheKey = `_apollo_job_postings_${organizationId}${pageSuffix}`;
    if (propsValue.cacheResponse) {
      const cached = await store.get<unknown>(cacheKey, StoreScope.PROJECT);
      if (cached) {
        return cached;
      }
    }
    const body = await apolloRequests.listJobPostings({ apiKey: apiKeyOf(auth), organizationId, page, perPage });
    const postings = recordsOf(body['organization_job_postings']);
    if (propsValue.cacheResponse) {
      await store.put(cacheKey, postings, StoreScope.PROJECT);
    }
    return postings;
  },
});
