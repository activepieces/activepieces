import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smooveApiCall } from './client';
import { SmooveAuthProps } from './client';

export const contactIdDropdown = Property.Dropdown({
  displayName: 'Contact ID',
  description: 'Select a contact to use',
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
      const contacts = await smooveApiCall<any[]>({
        method: HttpMethod.GET,
        resourceUri: '/Contacts',
        auth: auth as SmooveAuthProps,
      });

      return {
        disabled: false,
        options: contacts.map((contact) => ({
          label: `${contact.firstName ?? ''} ${contact.lastName ?? ''} (${contact.email ?? contact.id})`,
          value: contact.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load contacts',
      };
    }
  },
});

export const landingPageIdDropdown = Property.Dropdown({
  displayName: 'Landing Page/Form ID',
  description: 'Select a landing page or form',
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
      const landingPages = await smooveApiCall<any[]>({
        method: HttpMethod.GET,
        resourceUri: '/LandingPages',
        auth: auth as SmooveAuthProps,
      });

      return {
        disabled: false,
        options: landingPages.map((page) => ({
          label: page.formTitle,
          value: page.formId,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load landing pages',
      };
    }
  },
});

export const listIdDropdown = Property.Dropdown({
  displayName: 'List ID',
  description: 'Select a mailing list',
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
      const lists = await smooveApiCall<any[]>({
        method: HttpMethod.GET,
        resourceUri: '/Lists',
        auth: auth as SmooveAuthProps,
      });

      return {
        disabled: false,
        options: lists.map((list) => ({
          label: list.name,
          value: list.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load mailing lists',
      };
    }
  },
});
