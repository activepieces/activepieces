import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { FathomAuth } from '../common/auth';

export const findTeamMember = createAction({
  auth: FathomAuth,
  name: 'find_team_member',
  displayName: 'Find Team Member',
  description: 'Find a Fathom team member based on their email address.',

  props: {
    team: Property.ShortText({
      displayName: 'Team Name ',
      description:
        'Optionally filter members by team name before searching for the email.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the team member to search for.',
      required: true,
    }),

  },

  async run({ auth, propsValue }) {
    const { email, team } = propsValue;

    const allMembers: any[] = [];
    let cursor: string | null = null;

    try {
      do {
        const queryParams = new URLSearchParams();
        if (cursor) queryParams.append('cursor', cursor);
        if (team) queryParams.append('team', team);

        const path = `/team_members${queryParams.toString() ? `?${queryParams}` : ''}`;
        const response = await makeRequest(auth, HttpMethod.GET, path);

        if (response?.items) {
          allMembers.push(...response.items);
        }

        cursor = response.next_cursor || null;
      } while (cursor);

      const matchingMembers = allMembers.filter(
        (member: any) =>
          member.email?.toLowerCase() === email.toLowerCase()
      );

      return matchingMembers.length > 0
        ? matchingMembers
        : { message: `No team member found with email "${email}"${team ? ` in team "${team}"` : ''}.` };

    } catch (error: any) {
      throw new Error(`Failed to fetch team members: ${error.message || error}`);
    }
  },
});
