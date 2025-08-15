import { createAction, Property } from '@activepieces/pieces-framework';

import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleChatAuth } from '../common/auth';
import { spaceIdDropdown } from '../common/props';

export const addASpaceMember = createAction({
  auth: googleChatAuth,
  name: 'addASpaceMember',
  displayName: 'Add a Space Member',
  description: 'Add a user to a Google Chat space',
  props: {
    space_id: spaceIdDropdown,
    name: Property.ShortText({
      displayName: 'Space Name',
      description:
        'The space resource name (e.g., spaces/SPACE_ID) where the member will be added',
      required: true,
    }),
    memberEmail: Property.ShortText({
      displayName: 'Member Email',
      description: 'Email address of the user to add to the space',
      required: true,
    }),
    MembershipState: Property.StaticDropdown({
      displayName: 'Membership State',
      description: 'State of the membership to create',
      required: true,
      defaultValue: 'MEMBERSHIP_STATE_UNSPECIFIED',
      options: {
        options: [
          { label: 'Unspecified', value: 'MEMBERSHIP_STATE_UNSPECIFIED' },
          { label: 'Joined', value: 'JOINED' },
          { label: 'Invited', value: 'INVITED' },
          { label: 'Not a Member', value: 'NOT_A_MEMBER' },
        ],
      },
    }),
    MembershipRole: Property.StaticDropdown({
      displayName: 'Member Role',
      description: 'Role to assign to the new member',
      required: false,
      defaultValue: 'MEMBERSHIP_ROLE_UNSPECIFIED',
      options: {
        options: [
          { label: 'Unspecified', value: 'MEMBERSHIP_ROLE_UNSPECIFIED' },
          { label: 'Member', value: 'ROLE_MEMBER' },
          { label: 'Manager', value: 'ROLE_MANAGER' },
        ],
      },
    }),
  },
  async run(context) {
    const { space_id, memberEmail, MembershipRole } = context.propsValue;

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    
    const chat = google.chat({ version: 'v1', auth: authClient });

    // Construct the space name if needed
    let spaceName = space_id;
    if (!space_id.startsWith('spaces/')) {
      spaceName = `spaces/${space_id}`;
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
        role: MembershipRole,
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
