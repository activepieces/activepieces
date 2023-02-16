import { OAuth2PropertyValue, Property } from '@activepieces/framework';
import { todoistRestClient } from './client/rest-client';

export const todoistAuthentication = Property.OAuth2({
  displayName: 'authentication',
  required: true,
  authUrl: 'https://todoist.com/oauth/authorize',
  tokenUrl: 'https://todoist.com/oauth/access_token',
  scope: [
    'data:read_write',
  ],
});

const buildEmptyList = ({ placeholder }: { placeholder: string }) => {
  return {
    disabled: true,
    options: [],
    placeholder,
  }
};

export const todoistProjectIdDropdown = Property.Dropdown<string>({
  displayName: 'Project',
  refreshers: ['authentication'],
  description: 'Task project ID. If not set, task is put to user\'s Inbox.',
  required: false,
  options: async (propsValue) => {
    if (propsValue['authentication'] === undefined) {
      return buildEmptyList({
        placeholder: 'Please select an authentication',
      });
    }

    const token = (propsValue['authentication'] as OAuth2PropertyValue).access_token;
    const projects = await todoistRestClient.projects.list({ token });

    if (projects.length === 0) {
      return buildEmptyList({
        placeholder: 'No projects found! Please create a project.',
      });
    }

    const options = projects.map(p => ({
      label: p.name,
      value: p.id,
    }));

    return {
      disabled: false,
      options,
    };
  }
});
