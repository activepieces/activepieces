import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const leaveTeam = createAction({
  auth: villageAuth,
  name: 'leave_team',
  displayName: 'Leave Team',
  description:
    'Leave a team you are a member of. If you are the last member of a non-paid team, the team is deleted. Admins of paid teams cannot leave — use Cancel Plan instead.',
  props: {
    team_id: Property.ShortText({
      displayName: 'Team ID',
      description: 'ID of the team to leave',
      required: true,
    }),
  },
  async run(context) {
    const { team_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/teams/leave`,
      headers: { Authorization: `Bearer ${context.auth}` },
      body: { team_id },
    });
    return response.body;
  },
});
