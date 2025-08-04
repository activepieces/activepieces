import { googleChatApiAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const addSpaceMember = createAction({
  auth: googleChatApiAuth,
  name: 'add-space-member',
  displayName: 'Add a Space Member',
  description: 'Add a user to a Google Chat space',
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The ID of the space to add the member to',
      required: true,
    }),
    memberEmail: Property.ShortText({
      displayName: 'Member Email',
      description: 'The email address of the user to add to the space',
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Member Role',
      description: 'The role to assign to the member',
      required: false,
      options: {
        options: [
          { label: 'Member', value: 'MEMBER' },
          { label: 'Admin', value: 'ADMIN' },
        ],
      },
    }),
  },
  run: async ({ auth, propsValue }) => {
    const { spaceId, memberEmail, role } = propsValue;

    const baseUrl = 'https://chat.googleapis.com/v1';
    const endpoint = `${baseUrl}/spaces/${spaceId}/members`;

    const memberData: any = {
      member: {
        name: `users/${memberEmail}`,
      },
    };

    if (role) {
      memberData.role = role;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memberData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add space member: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  },
}); 