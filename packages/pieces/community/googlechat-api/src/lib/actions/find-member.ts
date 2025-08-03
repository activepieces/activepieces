import { googleChatApiAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const findMember = createAction({
  auth: googleChatApiAuth,
  name: 'find-member',
  displayName: 'Find Member',
  description: 'Search space member by email',
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The ID of the space to search in',
      required: true,
    }),
    memberEmail: Property.ShortText({
      displayName: 'Member Email',
      description: 'The email address of the member to find',
      required: true,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const { spaceId, memberEmail } = propsValue;

    const baseUrl = 'https://chat.googleapis.com/v1';
    const endpoint = `${baseUrl}/spaces/${spaceId}/members/${memberEmail}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to find member: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  },
}); 