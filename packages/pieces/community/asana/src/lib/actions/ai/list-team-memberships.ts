import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaTeamMembershipListOutputSchema } from '../../output-schemas';

export const asanaListTeamMembershipsAction = createAction({
  auth: asanaAuth,
  name: 'list_team_memberships',
  classification: 'SEARCH',
  displayName: 'List Team Memberships',
  description: 'List the members of an Asana team, or the team memberships of a user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists team memberships with is_admin, is_guest and is_limited_access flags. Set Team GID for everyone in one team, or User together with Workspace GID for every team membership of that user. Use it to check who administers a team before changing it. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTeamMembershipListOutputSchema,
  props: {
    team: Property.ShortText({
      displayName: 'Team GID',
      description: 'Gid of the team whose members to list. Obtain it from List Teams. Set this, or User with Workspace GID.',
      required: false,
    }),
    user: Property.ShortText({
      displayName: 'User',
      description: 'User whose team memberships to list: "me", an email address or a user gid. Requires Workspace GID.',
      required: false,
    }),
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the organization to search in. Required with User, and only used with User.',
      required: false,
    }),
    limit: asanaProps.limit({ noun: 'memberships' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { team, user, workspace, limit, offset } = context.propsValue;
    const hasTeam = asanaUtils.hasValue(team);
    const hasUser = asanaUtils.hasValue(user);
    const hasWorkspace = asanaUtils.hasValue(workspace);
    if (hasUser !== hasWorkspace) {
      throw new Error('User and Workspace GID must be set together; Asana needs both to list a user\'s team memberships.');
    }
    if (!hasTeam && !hasUser) {
      throw new Error('Set Team GID, or User together with Workspace GID.');
    }
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/team_memberships',
      operation: 'List Team Memberships',
      query: {
        team: hasTeam ? String(team).trim() : undefined,
        user: hasUser ? String(user).trim() : undefined,
        workspace: hasWorkspace ? String(workspace).trim() : undefined,
        opt_fields: ASANA_FIELDS.teamMembership,
      },
      limit,
      offset,
    });
  },
});
