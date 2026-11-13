import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaUserListOutputSchema } from '../../output-schemas';

export const asanaListUsersAction = createAction({
  auth: asanaAuth,
  name: 'list_users',
  classification: 'SEARCH',
  displayName: 'List Users',
  description: 'List the users in an Asana workspace or team.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists users (gid, name, email) in a workspace or in a team, sorted by user gid. Set Workspace GID, Team GID or both. Use it to find a user gid for assignees, followers or memberships; to look up one known email use Get User instead. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaUserListOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace or organization whose users to list. Obtain it from List Workspaces. Set this, Team GID, or both.',
      required: false,
    }),
    team: Property.ShortText({
      displayName: 'Team GID',
      description: 'Gid of the team whose users to list. Obtain it from List Teams. Set this, Workspace GID, or both.',
      required: false,
    }),
    limit: asanaProps.limit({ noun: 'users' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { workspace, team, limit, offset } = context.propsValue;
    if (!asanaUtils.hasValue(workspace) && !asanaUtils.hasValue(team)) {
      throw new Error('Set Workspace GID or Team GID so Asana knows which users to list.');
    }
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/users',
      operation: 'List Users',
      query: {
        workspace: asanaUtils.hasValue(workspace) ? String(workspace).trim() : undefined,
        team: asanaUtils.hasValue(team) ? String(team).trim() : undefined,
        opt_fields: ASANA_FIELDS.userList,
      },
      limit,
      offset,
    });
  },
});
