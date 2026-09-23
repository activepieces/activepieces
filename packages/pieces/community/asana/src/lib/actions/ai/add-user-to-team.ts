import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaTeamMembershipOutputSchema } from '../../output-schemas';

export const asanaAddUserToTeamAction = createAction({
  auth: asanaAuth,
  name: 'add_user_to_team',
  classification: 'WRITE',
  displayName: 'Add User to Team',
  description: 'Add a user to an Asana team.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a user to a team and returns the team membership. The connected user must already be a member of the team, and the added user must belong to the same organization (use Add User to Workspace first if needed). Adding an existing member leaves them in place, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTeamMembershipOutputSchema,
  props: {
    team: Property.ShortText({
      displayName: 'Team GID',
      description: 'Gid of the team. Obtain it from List Teams or List User Teams.',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'User',
      description: 'User to add: "me", an email address or a user gid.',
      required: true,
    }),
  },
  async run(context) {
    const { team, user } = context.propsValue;
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/teams/${asanaUtils.pathSegment(team)}/addUser`,
      operation: 'Add User to Team',
      query: { opt_fields: ASANA_FIELDS.teamMembership },
      data: { user: user.trim() },
    });
  },
});
