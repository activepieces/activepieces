import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const listDeals = createAction({
  auth: ninjapipeAuth,
  name: 'list_deals',
  classification: 'SEARCH',
  displayName: 'List Deals',
  description: 'Lists deals one page at a time, or all pages with Return All.',
  audience: 'human',
  aiMetadata: {
    description: 'List NinjaPipe deals, filtered by search text, status or owner. Returns one page (limit 1-100, use nextPage to continue) or every page with Return All (capped at 5,000; hasMore tells when the cap cut it short). Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.dealList,
  props: {
    search: ninjapipeProps.search(),
    statusFilter: ninjapipeProps.staticDropdown({ displayName: 'Status', description: 'Only deals with this status.', values: ['Open', 'In Progress', 'Won', 'Lost'] }),
    ownerFilter: ninjapipeProps.member({ displayName: 'Owner', description: 'Only deals owned by this member (owner_id).' }),
    sortBy: ninjapipeProps.staticDropdown({ displayName: 'Sort By', description: 'Field to sort by. Default: created_at.', values: ['created_at', 'updated_at', 'name', 'value', 'status'] }),
    sortOrder: ninjapipeProps.staticDropdown({ displayName: 'Sort Order', description: 'Default: desc.', values: ['desc', 'asc'] }),
    limit: ninjapipeProps.limit(),
    page: ninjapipeProps.page(),
    returnAll: ninjapipeProps.returnAll(),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.runList({
      auth: ninjapipeClient.readAuth(context.auth),
      path: '/deals',
      query: { search: p.search, status: p.statusFilter, owner_id: p.ownerFilter, sort_by: p.sortBy, sort_order: p.sortOrder },
      operation: 'list deals',
      returnAll: p.returnAll,
      page: p.page,
      limit: p.limit,
    });
  },
});
