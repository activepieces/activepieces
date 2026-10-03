import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { AsanaRecord, asanaClient, asanaProps } from '../../common/client';
import { asanaFavoriteListOutputSchema } from '../../output-schemas';

const RESOURCE_TYPE_OPTIONS = [
  { label: 'Project', value: 'project' },
  { label: 'Task', value: 'task' },
  { label: 'Tag', value: 'tag' },
  { label: 'User', value: 'user' },
  { label: 'Portfolio', value: 'portfolio' },
  { label: 'Project template', value: 'project_template' },
];

export const asanaListFavoritesAction = createAction({
  auth: asanaAuth,
  name: 'list_favorites',
  classification: 'SEARCH',
  displayName: 'List My Favorites',
  description: 'List the connected user\'s favorites of one type in a workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the connected user\'s own favorites (projects, tasks, tags, users, portfolios or project templates) in one workspace, in sidebar order. Asana only returns favorites for the authenticated user, so there is no way to read another user\'s favorites. A quick way to find the projects the user cares about. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaFavoriteListOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace to read favorites from. Obtain it from List Workspaces or Get Current User.',
      required: true,
    }),
    resource_type: Property.StaticDropdown({
      displayName: 'Favorite Type',
      description: 'Kind of favorites to return.',
      required: true,
      options: { disabled: false, options: RESOURCE_TYPE_OPTIONS },
    }),
    limit: asanaProps.limit({ noun: 'favorites' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { workspace, resource_type, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/users/me/favorites',
      operation: 'List My Favorites',
      query: { workspace: workspace.trim(), resource_type, opt_fields: 'name' },
      limit,
      offset,
    });
  },
});
