import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaRemoveUserFromTeamOutputSchema } from '../../output-schemas';

export const asanaRemoveUserFromTeamAction = createAction({
  auth: asanaAuth,
  name: 'remove_user_from_team',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove User from Team',
  description: 'Remove a user from an Asana team.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a user from a team, revoking the access they had through it (team projects that are not shared with them otherwise). The connected user must be a member of the team to remove themselves or others. The user\'s own tasks and projects are kept, and Add User to Team restores the membership. Converges on repeat: the user stays out of the team.',
    idempotent: true,
  },
  outputSchema: asanaRemoveUserFromTeamOutputSchema,
  props: {
    team: Property.ShortText({
      displayName: 'Team GID',
      description: 'Gid of the team. Obtain it from List Teams or List User Teams.',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'User',
      description: 'User to remove: "me", an email address or a user gid. Obtain it from List Team Memberships.',
      required: true,
    }),
  },
  async run(context) {
    const team = context.propsValue.team.trim();
    const user = context.propsValue.user.trim();
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/teams/${asanaUtils.pathSegment(team)}/removeUser`,
      operation: 'Remove User from Team',
      data: { user },
    });
    return { success: true, team_gid: team, user };
  },
});
