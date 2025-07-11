import { Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pinterestAuth } from './auth';

interface DropdownParams {
  displayName: string;
  description?: string;
  required: boolean;
}

export const boardId = (params: DropdownParams) =>
  Property.Dropdown({
    displayName: params.displayName,
    description: params.description,
    required: params.required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Pinterest account.',
          options: [],
        };
      }

      const authValue = auth as PiecePropValueSchema<typeof pinterestAuth>;

      const response = await httpClient.sendRequest<{ items: any[] }>({
        method: HttpMethod.GET,
        url: 'https://api.pinterest.com/v5/boards',
        headers: {
          Authorization: `Bearer ${authValue.access_token}`,
        },
      });

      return {
        disabled: false,
        options: response.body.items.map((board) => ({
          label: `${board.name} (${board.id})`,
          value: board.id,
        })),
      };
    },
  });

export const pinId = (params: DropdownParams) =>
  Property.Dropdown({
    displayName: params.displayName,
    description: params.description,
    required: params.required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Pinterest account.',
          options: [],
        };
      }

      const authValue = auth as PiecePropValueSchema<typeof pinterestAuth>;

      const response = await httpClient.sendRequest<{ items: any[] }>({
        method: HttpMethod.GET,
        url: 'https://api.pinterest.com/v5/pins',
        headers: {
          Authorization: `Bearer ${authValue.access_token}`,
        },
      });

      return {
        disabled: false,
        options: response.body.items.map((pin) => ({
          label: `${pin.title || pin.id} (${pin.id})`,
          value: pin.id,
        })),
      };
    },
  });
