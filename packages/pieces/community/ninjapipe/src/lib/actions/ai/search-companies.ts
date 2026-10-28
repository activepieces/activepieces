import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiSearchCompanies = createAction({
  auth: ninjapipeAuth,
  name: 'ai_search_companies',
  classification: 'SEARCH',
  displayName: 'Search Companies',
  description: 'Searches companies page by page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Search NinjaPipe companies by free text and filter by status or owner_id. Returns one page: items, total, hasMore and nextPage. Use it to find a company_id for contacts, deals or lists. Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.companyList,
  props: {
    search: ninjapipeAiProps.text({ displayName: 'Search', description: 'Free text matched against the company name and other text fields.' }),
    status: ninjapipeAiProps.text({ displayName: 'Status', description: 'Only companies with this status.' }),
    owner_id: ninjapipeAiProps.optionalId({ displayName: 'Owner ID', description: 'Only companies owned by a workspace member account_id from ai_list_workspace_members.' }),
    sort_by: ninjapipeAiProps.sortBy({ values: ['created_at', 'updated_at', 'name'] }),
    sort_order: ninjapipeAiProps.sortOrder(),
    page: ninjapipeAiProps.page(),
    limit: ninjapipeAiProps.limit(),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.listPage({
      auth: ninjapipeClient.readAuth(context.auth),
      path: '/companies',
      query: { search: p.search, status: p.status, owner_id: p.owner_id, sort_by: p.sort_by, sort_order: p.sort_order },
      page: ninjapipeClient.readPage(p.page),
      limit: ninjapipeClient.clampLimit({ value: p.limit }),
      operation: 'search companies',
    });
  },
});
