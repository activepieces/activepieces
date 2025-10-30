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
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the team member to search for.',
      required: true,
    }),

  },

  async run({ auth, propsValue }) {
    const { email } = propsValue;
    const response = await makeRequest(auth, HttpMethod.GET, '/team_members');
    const members = response.items || [];

    const matchingMembers = members.filter(
      (member: any) =>
        member.email?.toLowerCase() === email.toLowerCase()
    );

    return matchingMembers.length > 0
      ? matchingMembers
      : { message: `No team member found with email "${email}"` };
  },
});
