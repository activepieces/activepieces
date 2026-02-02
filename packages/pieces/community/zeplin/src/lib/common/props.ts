import { Property } from '@activepieces/pieces-framework';
import { ziplinAuth } from './auth';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const project_idProp = Property.Dropdown({
  auth: ziplinAuth,
  displayName: 'Project',
  description: 'Select the Zeplin project',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Zeplin account first',
        options: [],
      };
    }
    try {
      const access_token = auth?.secret_text;
      const response = (await makeRequest(
        access_token as string,
        HttpMethod.GET,
        `/projects`
      )) as any[];

      const options = response.map((project: any) => ({
        label: project.name,
        value: project.id,
      }));

      return {
        disabled: false,
        options,
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not fetch projects',
      };
    }
  },
});

export const screen_idProp = Property.Dropdown({
  auth: ziplinAuth,
  displayName: 'Screen',
  description: 'Select the Zeplin screen',
  required: true,
  refreshers: ['projectId'],
  options: async ({ auth, projectId }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Zeplin account first',
        options: [],
      };
    }
    if (!projectId) {
      return {
        disabled: true,
        placeholder: 'Select a project first',
        options: [],
      };
    }
    try {
      const access_token = auth?.secret_text as string;

      const response = (await makeRequest(
        access_token,
        HttpMethod.GET,
        `/projects/${projectId}/screens`
      )) as any[];

      const options = response.map((screen: any) => ({
        label: screen.name,
        value: screen.id,
      }));

      return {
        disabled: false,
        options,
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not fetch screens',
      };
    }
  },
});
