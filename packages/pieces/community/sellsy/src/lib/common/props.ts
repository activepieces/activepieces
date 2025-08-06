import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';
import { Property } from '@activepieces/pieces-framework';

export const commentIdDropdown = Property.Dropdown({
  displayName: 'Comment ID',
  description: 'Select the comment to reply to',
  required: true,
  refreshers: [],
  options: async ({ auth }: { auth?: { access_token: string } }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth.access_token,
        HttpMethod.GET,
        '/comments'
      );
      return {
        disabled: false,
        options: response.data.map((comment: any) => ({
          label: comment.description,
          value: comment.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teams',
      };
    }
  },
});
