import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiSearchDeals = createAction({
  auth: ninjapipeAuth,
  name: 'ai_search_deals',
  classification: 'SEARCH',
  displayName: 'Search Deals',
  description: 'Searches deals page by page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Search NinjaPipe deals by name and filter by status (Open, In Progress, Won, Lost) or owner_id; sort by value to find the biggest. Returns one page: items, total, hasMore and nextPage. Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.dealList,
  props: {
    search: ninjapipeAiProps.text({ displayName: 'Search', description: 'Free text matched against the deal name.' }),
    status: ninjapipeAiProps.choice({ displayName: 'Status', description: 'Only deals with this status.', values: ['Open', 'In Progress', 'Won', 'Lost'] }),
    owner_id: ninjapipeAiProps.optionalId({ displayName: 'Owner ID', description: 'Only deals owned by a workspace member account_id from ai_list_workspace_members.' }),
    sort_by: ninjapipeAiProps.sortBy({ values: ['created_at', 'updated_at', 'name', 'value', 'status'] }),
    sort_order: ninjapipeAiProps.sortOrder(),
    page: ninjapipeAiProps.page(),
    limit: ninjapipeAiProps.limit(),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.listPage({
      auth: ninjapipeClient.readAuth(context.auth),
      path: '/deals',
      query: { search: p.search, status: p.status, owner_id: p.owner_id, sort_by: p.sort_by, sort_order: p.sort_order },
      page: ninjapipeClient.readPage(p.page),
      limit: ninjapipeClient.clampLimit({ value: p.limit }),
      operation: 'search deals',
    });
  },
});
