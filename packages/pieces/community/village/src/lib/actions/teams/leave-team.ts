import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const leaveTeam = createAction({
  auth: villageAuth,
  name: 'leave_team',
  classification: 'DESTRUCTIVE',
  displayName: 'Leave Team',
  description:
    'Leave a team you are a member of. If you are the last member of a non-paid team, the team is deleted. Admins of paid teams cannot leave — use Cancel Plan instead.',
  audience: 'both',
  aiMetadata: {
    description:
      'Remove the authenticated user from a team by team ID. Not idempotent: leaving the same team again fails since membership is already gone, and leaving as the last member of a non-paid team deletes the team. Admins of paid teams cannot leave this way.',
    idempotent: false,
  },
  outputSchema: villageSchemas.leaveTeam,
  props: {
    team_id: Property.ShortText({
      displayName: 'Team ID',
      description: 'ID of the team to leave',
      required: true,
    }),
  },
  async run(context) {
    const { team_id } = context.propsValue;

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/teams/leave`,
      body: { team_id },
    });
    return response;
  },
});
