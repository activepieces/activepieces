import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export async function fetchRooms(access_token: string) {
  const response = await makeRequest(access_token, HttpMethod.GET, `/rooms`);
  return response.items;
}

export const roomIdDropdown = (rooms: { id: string; title: string }[]) =>
  Property.StaticDropdown({
    displayName: 'Room',
    description: 'Select the room',
    required: true,

    options: {
      disabled: false,
      options: rooms.map((room) => ({ label: room.title, value: room.id })),
    },
  });
