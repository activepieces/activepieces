import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleChatAuth } from '../common/auth';
import { spaceIdDropdown } from '../common/props';

export const findMember = createAction({
  auth: googleChatAuth,
  name: 'findMember',
  displayName: 'Find Member',
  description: 'Search space member by email',
  props: {
    space_id: spaceIdDropdown,
    memberEmail: Property.ShortText({
      displayName: 'Member Email',
      description: 'Email address of the member to find',
      required: true,
    }),
  },
  async run(context) {
    const { space_id, memberEmail } = context.propsValue;

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const chat = google.chat({ version: 'v1', auth: authClient });

    // Construct the space name if needed
    let spaceName = space_id;
    if (!space_id.startsWith('spaces/')) {
      spaceName = `spaces/${space_id}`;
    }

    try {
      // Try to get the specific member by constructing the member resource name
      const memberName = `${spaceName}/members/users/${memberEmail}`;

      const response = await chat.spaces.members.get({
        name: memberName,
      });

      return {
        found: true,
        member: {
          name: response.data.name,
          member: response.data.member,
          role: response.data.role,
          createTime: response.data.createTime,

          state: response.data.state,
        },
      };
    } catch (error) {
      try {
        const listResponse = await chat.spaces.members.list({
          parent: spaceName,
          pageSize: 100,
        });

        const foundMember = listResponse.data.memberships?.find(
          (membership) =>
            membership.member?.name === `users/${memberEmail}` ||
            membership.member?.displayName === memberEmail
        );

        if (foundMember) {
          return {
            found: true,
            member: {
              name: foundMember.name,
              member: foundMember.member,
              role: foundMember.role,
              createTime: foundMember.createTime,

              state: foundMember.state,
            },
          };
        } else {
          return {
            found: false,
            message: `Member with email ${memberEmail} not found in the space`,
          };
        }
      } catch (listError) {
        return {
          found: false,
          message: `Error searching for member: ${listError}`,
        };
      }
    }
  },
});
