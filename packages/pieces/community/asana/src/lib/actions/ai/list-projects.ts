import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps } from '../../common/client';
import { asanaProjectListOutputSchema } from '../../output-schemas';

export const asanaListProjectsAction = createAction({
  auth: asanaAuth,
  name: 'list_projects',
  classification: 'SEARCH',
  displayName: 'List Projects',
  description: 'List the projects in an Asana workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the projects in a workspace that the connected user can see, optionally only archived or only active ones. Use Search Workspace Objects to find a project by name, or List Memberships with a team to list a team\'s projects. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaProjectListOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace or organization, for example 1201234567890123. Obtain it from List Workspaces.',
      required: true,
    }),
    archived: asanaProps.optionalBoolean({
      displayName: 'Archived',
      description: 'Yes returns only archived projects, No only active ones. Leave empty to return both.',
    }),
    limit: asanaProps.limit({ noun: 'projects' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { workspace, archived, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/projects',
      operation: 'List Projects',
      query: {
        workspace: workspace.trim(),
        archived: archived === undefined || archived === null ? undefined : archived,
        opt_fields: ASANA_FIELDS.projectList,
      },
      limit,
      offset,
    });
  },
});
