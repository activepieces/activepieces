import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { ForeplayAuth } from '../common/auth';

export const BoardIdDropdown = Property.Dropdown<string>({
  displayName: 'Board ID',
  description: 'Select a board from your account',
  required: true,
  refreshers: [], 
  async options({ auth }) {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Foreplay account first',
        options: [],
      };
    }

    try {
   
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/boards'
      );
      const boards = Array.isArray(response) ? response : response?.data ?? [];

      return {
        disabled: false,
        options: boards.map((board: any) => ({
          label: board.name || board.id,
          value: board.id,
        })),
      };
    } catch (e: any) {
      return {
        disabled: true,
        placeholder: `Failed to load boards: ${e.message}`,
        options: [],
      };
    }
  },
});
