import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { opportunityPageOutputSchema } from '../../common/output-schemas';

export const aiSearchOpportunities = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_search_opportunities',
  classification: 'SEARCH',
  displayName: 'Search Opportunities',
  description: 'Searches opportunities.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches Capsule CRM opportunities (deals) by free text, one page at a time. Leave Query empty to list all. Returns each opportunity with party, milestone, value and owner; use its id as Opportunity ID in other tools. Read-only.',
    idempotent: true,
  },
  outputSchema: opportunityPageOutputSchema,
  props: {
    query: Property.ShortText({ displayName: 'Query', description: 'Free text to match, such as the opportunity name. Leave empty to list all.', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1. Defaults to 1.', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: 'Results per page, 1-100. Defaults to 50.', required: false }),
  },
  async run({ auth, propsValue }) {
    const paging = capsuleCrmClient.pageArgs({ page: propsValue.page, perPage: propsValue.per_page });
    const result = await capsuleCrmClient.searchOpportunitiesPage({ auth, searchTerm: propsValue.query, ...paging });
    return { opportunities: result.items, page: paging.page, hasMore: result.hasMore };
  },
});
