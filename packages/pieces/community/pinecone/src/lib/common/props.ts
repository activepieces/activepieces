import { HttpMethod } from '@activepieces/pieces-common';
import { makeDataPlaneRequest, makeRequest } from './client';
import { Property } from '@activepieces/pieces-framework';


export const hostDropdown = Property.Dropdown({
  displayName: 'Host',
  description: 'Select the host to use',
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
      '/indexes'
    );
    return {
      disabled: false,
      options: response.indexes.map((index: any) => ({
        label: index.name,
        value: index.host,
      })),
    };
  },
});

export const vectorsIds = Property.MultiSelectDropdown({
  displayName: 'Vector IDs',
  description: 'Select the vector IDs to use',
  required: true,
  refreshers: ['auth', 'host'],
  options: async ({ auth, host }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    if (!host) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select an host first',
      };
    }

    try {
      const response = await makeDataPlaneRequest(
        auth as string,
        host as string,
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
        placeholder: 'Error loading vectors',
      };
    }
  },
});

export const vectorIdDropdown = Property.Dropdown({
  displayName: 'Vector ID',
  description: 'Select the vector ID to use',
  required: true,
  refreshers: ['auth','host'],
  options: async ({ auth, host }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    if (!host) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select an host first',
      };
    }

    const response = await makeDataPlaneRequest(
      auth as string,
      host as string,
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
