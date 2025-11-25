import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { askHandleApiCall } from './client';

export const roomDropdown = Property.Dropdown({
  displayName: 'Room',
  description: 'Select a room',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await askHandleApiCall(
        auth as string,
        HttpMethod.GET,
        '/rooms/'
      );

      const rooms = Array.isArray(response) ? response : (response as any)?.results || [];

      return {
        disabled: false,
        options: rooms.map((room: any) => ({
          label: room.name || room.label || `Room ${room.uuid}`,
          value: room.uuid,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading rooms',
      };
    }
  },
});

export const leadDropdown = Property.Dropdown({
  displayName: 'Lead',
  description: 'Select a lead',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await askHandleApiCall(
        auth as string,
        HttpMethod.GET,
        '/leads/'
      );

      const leads = Array.isArray(response) ? response : (response as any)?.results || [];

      return {
        disabled: false,
        options: leads.map((lead: any) => ({
          label: lead.nickname || lead.email || `Lead ${lead.uuid}`,
          value: lead.uuid,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading leads',
      };
    }
  },
});

