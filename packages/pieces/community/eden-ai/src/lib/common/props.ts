import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenApiCall } from './client';

interface EdenAiProject {
  project_id: string;
  project_name: string;
  user: string;
  project_type: string;
}

export const projectIdDropdown = Property.Dropdown({
  displayName: 'Project',
  description: 'Select the Eden AI project to use.',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    const apiKey = auth as string;

    if (!apiKey) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Eden AI account.',
      };
    }

    try {
      const projects = await edenApiCall<EdenAiProject[]>({
        method: HttpMethod.GET,
        resourceUri: '/aiproducts/',
        auth: { apiKey },
      });

      if (!projects || projects.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No projects found in your Eden AI account.',
        };
      }

      return {
        disabled: false,
        options: projects.map((project) => ({
          label: `${project.project_name}`,
          value: project.project_id,
        })),
        placeholder: 'Select a project',
      };
    } catch (e: any) {
      return {
        disabled: true,
        options: [],
        placeholder: e.message || 'Failed to load projects.',
      };
    }
  },
});
