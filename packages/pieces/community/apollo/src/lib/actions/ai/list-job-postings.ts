import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiListJobPostingsAction = createAction({
  auth: apolloAuth,
  name: 'ai_list_job_postings',
  classification: 'SEARCH',
  displayName: 'List Organization Job Postings',
  description: 'List current job postings for one company.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists one page of the current job postings (title, location, URL, posted date) for one company by Apollo organization ID from Search Organizations, to spot hiring activity. Costs 1 Apollo credit per page.',
    idempotent: true,
  },
  props: {
    organization_id: aiProps.id({ displayName: 'Organization ID', description: 'Apollo organization ID from Search Organizations (field organization_id).' }),
    page: aiProps.page(),
    per_page: aiProps.perPage({ max: 100, fallback: 25 }),
  },
  outputSchema: apolloOutputSchemas.jobPostings,
  async run({ propsValue, auth }) {
    const organizationId = apolloInputs.requireText({ value: propsValue.organization_id, label: 'Organization ID' });
    const { page, perPage } = apolloInputs.pageParams({ page: propsValue.page, perPage: propsValue.per_page, maxPerPage: 100, defaultPerPage: 25 });
    const body = await apolloRequests.listJobPostings({ apiKey: apiKeyOf(auth), organizationId, page, perPage });
    const jobPostings = recordsOf(body['organization_job_postings']).map((posting) => apolloMappers.jobPosting(posting));
    return { organization_id: organizationId, page, per_page: perPage, has_more: jobPostings.length >= perPage, job_postings: jobPostings };
  },
});
