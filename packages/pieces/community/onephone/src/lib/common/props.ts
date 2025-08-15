import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';
import { Property } from '@activepieces/pieces-framework';

export const contactIdDropdown = Property.Dropdown({
  displayName: 'Contact ID',
  description: 'Select the contact to update',
  required: false,
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
      const contacts = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/contacts'
      );
      return {
        disabled: false,
        options: contacts.data.map((contact: any) => ({
          label: contact.firstName + ' ' + contact.lastName,
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

export const phoneNumberIdDropdown = Property.Dropdown({
  displayName: 'Phone Number ID',
  description: 'Select the phone number to update',
  required: false,
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
      const phoneNumbers = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/phone-numbers'
      );
      return {
        disabled: false,
        options: phoneNumbers.data.map((phoneNumber: any) => ({
          label: phoneNumber.name,
          value: phoneNumber.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading phone numbers',
      };
    }
  },
});

export const callIdDropdown = Property.Dropdown({
  displayName: 'Call ID',
  description: 'Select the call to get summary for',
  required: false,
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
      const calls = await makeRequest(auth as string, HttpMethod.GET, '/calls');
      return {
        disabled: false,
        options: calls.data.map((call: any) => ({
          label: `${call.direction} call - ${call.participants.join(', ')} (${call.status})`,
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
