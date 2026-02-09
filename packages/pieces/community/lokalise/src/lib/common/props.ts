import { Property } from '@activepieces/pieces-framework';
import { lokaliseAuth } from './auth';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const projectDropdown = Property.Dropdown<string,true,typeof lokaliseAuth>({
  auth: lokaliseAuth,
  displayName: 'Project',
  description: 'Select the Lokalise project',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first',
        options: [],
      };
    }
    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        '/projects'
      );
      const projects = response.projects;

      return {
        disabled: false,
        options: projects.map((project: any) => ({
          label: project.name,
          value: project.project_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
      };
    }
  },
});

export const keyIdProp = Property.Dropdown({
  auth: lokaliseAuth,
  displayName: 'Key',
  description: 'Select the key',
  required: true,
  refreshers: ['projectId'],
  options: async ({ auth, projectId }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first',
        options: [],
      };
    }
    if (!projectId) {
      return {
        disabled: true,
        placeholder: 'Please select a project first',
        options: [],
      };
    }
    try {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        `/projects/${projectId}/keys`
      );
      const keys = response.keys;

      return {
        disabled: false,
        options: keys.map((key: any) => ({
          label:
            key.key_name.other ||
            key.key_name.ios ||
            key.key_name.android ||
            key.key_name.web,
          value: key.key_id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
      };
    }
  },
});
