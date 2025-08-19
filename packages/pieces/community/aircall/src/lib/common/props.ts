import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const callIdDropdown = Property.Dropdown({
  displayName: 'Call',
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
        auth as { username: string; password: string },
        HttpMethod.GET,
        '/calls'
      );

      const {calls} = response as {calls:{id:number,raw_digits:string, direction:string}[]}
      return {
        disabled: false,
        options: calls.map((call) => ({
          label: `${call.raw_digits} - ${call.direction}`,
          value: call.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading calls.',
      };
    }
  },
});

export const numberIdDropdown = Property.Dropdown({
  displayName: 'Number ID',
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
        auth as { username: string; password: string },
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
        auth as { username: string; password: string },
        HttpMethod.GET,
        '/contacts'
      );

      const {contacts} = response as {contacts:{id:string,first_name:string,last_name:string}[]}
      return {
        disabled: false,
        options: contacts.map((contact) => ({
          label:  `${contact.first_name || ""} ${contact.last_name || ""}` || contact.id,
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

export const tagIdDropdown = Property.MultiSelectDropdown({
  displayName: 'Tags',
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
        auth as { username: string; password: string },
        HttpMethod.GET,
        '/tags'
      );

      const {tags} = response as {tags:{id:number,name:string}[]}

      return {
        disabled: false,
        options: tags.map((tag) => ({
          label: tag.name,
          value: tag.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading tags',
      };
    }
  },
});
