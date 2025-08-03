import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const formatDateTime = (dateTime: string | Date): string => {
  if (typeof dateTime === 'string') {
    return dateTime.replace('.000Z', '+00:00');
  } else {
    const date = new Date(dateTime);
    return date.toISOString().replace('.000Z', '+00:00');
  }
};

export const userIdDropdown = Property.Dropdown({
  displayName: 'User ID',
  description: 'Select the user ',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/users'
      );
      return {
        disabled: false,
        options: response.users.map((user: any) => ({
          label: user.first_name + ' ' + user.last_name,
          value: user.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading users',
      };
    }
  },
});
