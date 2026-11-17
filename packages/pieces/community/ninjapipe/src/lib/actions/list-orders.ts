import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const listOrders = createAction({
  auth: ninjapipeAuth,
  name: 'list_orders',
  classification: 'SEARCH',
  displayName: 'List Orders',
  description: 'Lists orders one page at a time, or all pages with Return All.',
  audience: 'both',
  aiMetadata: {
    description: 'List NinjaPipe orders, filtered by search text or status. Returns one page (limit 1-100, use nextPage to continue) or every page with Return All (capped at 5,000; hasMore tells when the cap cut it short). Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.orderList,
  props: {
    search: ninjapipeProps.search(),
    statusFilter: ninjapipeProps.staticDropdown({ displayName: 'Status', description: 'Only orders with this status.', values: ['Processing', 'Shipped', 'Delivered', 'Cancelled'] }),
    sortBy: ninjapipeProps.staticDropdown({ displayName: 'Sort By', description: 'Field to sort by. Default: created_at.', values: ['created_at', 'updated_at', 'order_date', 'total_amount'] }),
    sortOrder: ninjapipeProps.staticDropdown({ displayName: 'Sort Order', description: 'Default: desc.', values: ['desc', 'asc'] }),
    limit: ninjapipeProps.limit(),
    page: ninjapipeProps.page(),
    returnAll: ninjapipeProps.returnAll(),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.runList({
      auth: ninjapipeClient.readAuth(context.auth),
      path: '/orders',
      query: { search: p.search, status: p.statusFilter, sort_by: p.sortBy, sort_order: p.sortOrder },
      operation: 'list orders',
      returnAll: p.returnAll,
      page: p.page,
      limit: p.limit,
    });
  },
});
