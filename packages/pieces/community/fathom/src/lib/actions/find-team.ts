import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { FathomAuth } from '../common/auth';

export const findTeam = createAction({
  auth: FathomAuth,
  name: 'find_team',
  displayName: 'Find Team',
  description: 'Find a team based on its name.',

  props: {
    team_name: Property.ShortText({
      displayName: 'Team Name',
      description: 'Name of the team to search for.',
      required: true,
    }),

  },

  async run({ auth, propsValue }) {
    const { team_name } = propsValue;

    const response = await makeRequest(auth, HttpMethod.GET, '/teams');

    const teams = response.items || [];

    const matchingTeams = teams.filter(
      (team: any) =>
        team.name?.toLowerCase().includes(team_name.toLowerCase())
    );

    return matchingTeams.length > 0
      ? matchingTeams
      : { message: `No team found with the name "${team_name}"` };
  },
});
