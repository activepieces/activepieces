import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';
import { Property } from '@activepieces/pieces-framework';

export const vectorsIds = Property.MultiSelectDropdown({
  displayName: 'Vector IDs',
  description: 'Select the vector IDs to use',
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
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/vectors/list'
      );
      return {
        disabled: false,
        options: response.vectors.map((vector: any) => ({
          label: vector.id,
          value: vector.id,
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

export const vectorIdDropdown = Property.Dropdown({
  displayName: 'Vector ID',
  description: 'Select the vector ID to use',
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

    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      '/vectors/list'
    );
    return {
      disabled: false,
      options: response.vectors.map((vector: any) => ({
        label: vector.id,
        value: vector.id,
      })),
    };
  },
});

