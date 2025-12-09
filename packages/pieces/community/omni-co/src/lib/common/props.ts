import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';
import { Property } from '@activepieces/pieces-framework';
import { omniAuth } from './auth';

export const modelIdDropdown = Property.Dropdown({ 
 auth: omniAuth,

  displayName: 'Model ID',
  description: 'Select the model containing the database',
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
      const models = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        '/models',
        {}
      );

      return {
        disabled: false,
        options: models.records.map((model: any) => ({
          label: model.name,
          value: model.id,
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

export const documentIdDropdown = Property.Dropdown({ 
 auth: omniAuth,

  displayName: 'Document',
  description: 'Select the document',
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
      const documents = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        `/documents`,
        {}
      );

      return {
        disabled: false,
        options: documents.records.map((document: any) => ({
          label: document.name,
          value: document.identifier,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading documents',
      };
    }
  },
});

export const scheduleIdDropdown = Property.Dropdown({ 
 auth: omniAuth,

  displayName: 'Schedule',
  description: 'Select the schedule',
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
      const schedules = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        `/schedules`,
        {}
      );

      return {
        disabled: false,
        options: schedules.records.map((schedule: any) => ({
          label: schedule.name,
          value: schedule.identifier,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading schedules',
      };
    }
  },
});
