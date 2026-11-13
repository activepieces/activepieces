import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const listPipelines = createAction({
  auth: ninjapipeAuth,
  name: 'list_pipelines',
  classification: 'SEARCH',
  displayName: 'List Pipelines',
  description: 'Lists pipelines one page at a time, or all pages with Return All.',
  audience: 'human',
  aiMetadata: {
    description: 'List NinjaPipe pipelines with their stages. Returns one page (limit 1-100, use nextPage to continue) or every page with Return All (capped at 5,000; hasMore tells when the cap cut it short). Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.pipelineList,
  props: {
    sortBy: ninjapipeProps.staticDropdown({ displayName: 'Sort By', description: 'Field to sort by. Default: created_at.', values: ['created_at', 'updated_at', 'name'] }),
    sortOrder: ninjapipeProps.staticDropdown({ displayName: 'Sort Order', description: 'Default: desc.', values: ['desc', 'asc'] }),
    limit: ninjapipeProps.limit(),
    page: ninjapipeProps.page(),
    returnAll: ninjapipeProps.returnAll(),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.runList({
      auth: ninjapipeClient.readAuth(context.auth),
      path: '/pipelines',
      query: { sort_by: p.sortBy, sort_order: p.sortOrder },
      operation: 'list pipelines',
      returnAll: p.returnAll,
      page: p.page,
      limit: p.limit,
    });
  },
});
