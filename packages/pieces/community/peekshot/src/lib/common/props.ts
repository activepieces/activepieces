import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { ListProjectsResponse } from './types';

export const projectId = Property.Dropdown({
  displayName: 'Project',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account first.',
        options: [],
      };
    }
    try {
      const response = await httpClient.sendRequest<ListProjectsResponse>({
        method: HttpMethod.GET,
        url: 'https://api.peekshot.com/api/v1/projects',
        headers: {
          'x-api-key': auth as string,
          'Content-Type': 'application/json',
        },
      });

      // Handle the specific API response format
      const responseData = response.body;
      if (responseData?.status === 'success' && responseData?.data?.projects) {
        const projects = responseData.data.projects;

        const projectOptions = projects.map((project) => ({
          label: project.name,
          value: project.id,
        }));

        return {
          options: projectOptions,
        };
      }

      return {
        options: [],
      };
    } catch (error) {
      return {
        options: [],
      };
    }
  },
});
