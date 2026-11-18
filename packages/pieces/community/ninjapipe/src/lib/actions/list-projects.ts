import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const listProjects = createAction({
  auth: ninjapipeAuth,
  name: 'list_projects',
  classification: 'SEARCH',
  displayName: 'List Projects',
  description: 'Lists projects one page at a time, or all pages with Return All.',
  audience: 'human',
  aiMetadata: {
    description: 'List NinjaPipe projects, filtered by search text or status. Returns one page (limit 1-100, use nextPage to continue) or every page with Return All (capped at 5,000; hasMore tells when the cap cut it short). Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.projectList,
  props: {
    search: ninjapipeProps.search(),
    statusFilter: Property.ShortText({ displayName: 'Status', description: 'Only projects with this status, e.g. Planning or In Progress.', required: false }),
    sortBy: ninjapipeProps.staticDropdown({ displayName: 'Sort By', description: 'Field to sort by. Default: created_at.', values: ['created_at', 'updated_at', 'name', 'due_date'] }),
    sortOrder: ninjapipeProps.staticDropdown({ displayName: 'Sort Order', description: 'Default: desc.', values: ['desc', 'asc'] }),
    limit: ninjapipeProps.limit(),
    page: ninjapipeProps.page(),
    returnAll: ninjapipeProps.returnAll(),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.runList({
      auth: ninjapipeClient.readAuth(context.auth),
      path: '/projects',
      query: { search: p.search, status: p.statusFilter, sort_by: p.sortBy, sort_order: p.sortOrder },
      operation: 'list projects',
      returnAll: p.returnAll,
      page: p.page,
      limit: p.limit,
    });
  },
});
