import { createAction } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps } from '../../common/client';
import { asanaWorkspaceListOutputSchema } from '../../output-schemas';

export const asanaListWorkspacesAction = createAction({
  auth: asanaAuth,
  name: 'list_workspaces',
  classification: 'SEARCH',
  displayName: 'List Workspaces',
  description: 'List the workspaces and organizations the connected user can access.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the workspaces and organizations visible to the connected user, with is_organization (teams exist only in organizations). Use it to find the workspace gid that projects, tags, typeahead search and assigned-task listing require. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaWorkspaceListOutputSchema,
  props: {
    limit: asanaProps.limit({ noun: 'workspaces' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/workspaces',
      operation: 'List Workspaces',
      query: { opt_fields: ASANA_FIELDS.workspace },
      limit,
      offset,
    });
  },
});
