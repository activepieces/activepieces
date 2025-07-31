import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const callIdDropdown = Property.Dropdown({
  displayName: 'Call ID',
  description: 'Select the call to comment on',
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
        '/calls'
      );
      return {
        disabled: false,
        options: response.calls.map((call: any) => ({
          label: call.name,
          value: call.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading calls',
      };
    }
  },
});

export const numberIdDropdown = Property.Dropdown({
  displayName: 'Number ID',
  description: 'Select the number to use',
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
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/numbers'
      );
      return {
        disabled: false,
        options: response.numbers.map((number: any) => ({
          label: number.name,
          value: number.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading numbers',
      };
    }
  },
});

export const contactIdDropdown = Property.Dropdown({
  displayName: 'Contact ID',
  description: 'Select the contact to update',
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
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/contacts'
      );
      return {
        disabled: false,
        options: response.contacts.map((contact: any) => ({
          label: `${contact.first_name} ${contact.last_name}`,
          value: contact.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading contacts',
      };
    }
  },
});
