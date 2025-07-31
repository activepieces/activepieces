import { createAction, Property } from '@activepieces/pieces-framework';

import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleChatAuth } from '../common/auth';

export const addASpaceMember = createAction({
  auth: googleChatAuth,
  name: 'addASpaceMember',
  displayName: 'Add a Space Member',
  description: 'Add a user to a Google Chat space',
  props: {
    space: Property.ShortText({
      displayName: 'Space Name',
      description: 'The space resource name (e.g., spaces/SPACE_ID) to add the member to',
      required: true,
    }),
    memberEmail: Property.ShortText({
      displayName: 'Member Email',
      description: 'Email address of the user to add to the space',
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Member Role',
      description: 'Role to assign to the new member',
      required: true,
      defaultValue: 'ROLE_MEMBER',
      options: {
        options: [
          { label: 'Member', value: 'ROLE_MEMBER' },
          { label: 'Manager', value: 'ROLE_MANAGER' },
        ],
      },
    }),
  },
  async run(context) {
    const { space, memberEmail, role } = context.propsValue;
    
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const chat = google.chat({ version: 'v1', auth: authClient });

    // Construct the space name if needed
    let spaceName = space;
    if (!space.startsWith('spaces/')) {
      spaceName = `spaces/${space}`;
    }

    // Create the membership
    const response = await chat.spaces.members.create({
      parent: spaceName,
      requestBody: {
        member: {
          name: `users/${memberEmail}`,
          displayName: memberEmail,
          type: 'HUMAN',
        },
        role: role,
      },
    });

    return {
      name: response.data.name,
      member: response.data.member,
      role: response.data.role,
      createTime: response.data.createTime,
      state: response.data.state,
    };
  },
});