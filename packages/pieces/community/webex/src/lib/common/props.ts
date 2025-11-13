import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const roomIdDropdown = Property.Dropdown({
  displayName: 'Room',
  description: 'Select the room',
  required: true,
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
      const roomsResponse = await makeRequest(
        (auth as any).access_token,
        HttpMethod.GET,
        `/rooms`
      );
      const rooms = roomsResponse.items;

      return {
        disabled: false,
        options: rooms.map((room: any) => ({
          label: room.title,
          value: room.id,
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
