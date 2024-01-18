import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { todoistRestClient } from './client/rest-client';

const buildEmptyList = ({ placeholder }: { placeholder: string }) => {
  return {
    disabled: true,
    options: [],
    placeholder,
  };
};

export const todoistProjectIdDropdown = Property.Dropdown<string>({
  displayName: 'Project',
  refreshers: [],
  description: "Task project ID. If not set, task is put to user's Inbox.",
  required: false,
  options: async ({ auth }) => {
    if (!auth) {
      return buildEmptyList({
        placeholder: 'Please select an authentication',
      });
    }

    const token = (auth as OAuth2PropertyValue).access_token;
    const projects = await todoistRestClient.projects.list({ token });

    if (projects.length === 0) {
      return buildEmptyList({
        placeholder: 'No projects found! Please create a project.',
      });
    }

    const options = projects.map((p) => ({
      label: p.name,
      value: p.id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});
