import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';

export const asanaListAllocationsAction = createAction({
  auth: asanaAuth,
  name: 'list_allocations',
  classification: 'SEARCH',
  displayName: 'List Allocations',
  description: 'List Asana resource-management allocations for a project or a person (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists allocations (who is booked on which project, for which dates, with what effort) filtered to a project, a user or placeholder, or both. Set Project GID or Assignee GID. Use it to check existing bookings before Create Allocation, or to find the gid for Update Allocation or Delete Allocation. Allocations need an Advanced or higher Asana plan with resource management. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    parent: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of a project, to list its allocations. Obtain it from List Projects.',
      required: false,
    }),
    assignee: Property.ShortText({
      displayName: 'Assignee GID',
      description: 'Gid of a user or placeholder, to list their allocations.',
      required: false,
    }),
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace, to scope an assignee\'s allocations. Obtain it from List Workspaces.',
      required: false,
    }),
    limit: asanaProps.limit({ noun: 'allocations' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { parent, assignee, workspace, limit, offset } = context.propsValue;
    if (!asanaUtils.hasValue(parent) && !asanaUtils.hasValue(assignee)) {
      throw new Error('Set Project GID or Assignee GID.');
    }
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/allocations',
      operation: 'List Allocations',
      query: {
        parent: asanaUtils.hasValue(parent) ? String(parent).trim() : undefined,
        assignee: asanaUtils.hasValue(assignee) ? String(assignee).trim() : undefined,
        workspace: asanaUtils.hasValue(workspace) ? String(workspace).trim() : undefined,
        opt_fields: ASANA_FIELDS.allocation,
      },
      limit,
      offset,
    });
  },
});
