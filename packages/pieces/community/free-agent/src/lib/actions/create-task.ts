import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { freeAgentAuth } from '../../index';

export const freeAgentCreateTask = createAction({
  displayName: 'Create Task',
  description: 'Create a task inside a project',
  auth: freeAgentAuth,
  name: 'create_task',
  props: {
    project_id: Property.Dropdown({
      displayName: 'Project',
      description: 'Select the project to create the task in',
      required: true,
      refreshers: [],
      auth: freeAgentAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.freeagent.com/v2/projects',
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: (auth as OAuth2PropertyValue).access_token,
            },
          });

          const projects = response.body['projects'] || [];
          return {
            options: projects.map((project: any) => ({
              label: project.name,
              value: project.url.split('/').pop(),
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load projects',
          };
        }
      },
    }),
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'The name of the task',
      required: true,
    }),
    is_billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether this task is billable to clients',
      required: false,
      defaultValue: true,
    }),
    billing_rate: Property.Number({
      displayName: 'Billing Rate',
      description: 'The rate at which the project is billed per billing period',
      required: false,
    }),
    billing_period: Property.StaticDropdown({
      displayName: 'Billing Period',
      description: 'The period for billing rate',
      required: false,
      options: {
        options: [
          { label: 'Hour', value: 'hour' },
          { label: 'Day', value: 'day' },
        ],
      },
      defaultValue: 'hour',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the task',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Hidden', value: 'Hidden' },
        ],
      },
      defaultValue: 'Active',
    }),
  },
  async run(context) {
    const { project_id, name, is_billable, billing_rate, billing_period, status } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const payload: any = {
      task: {
        name,
        is_billable: is_billable !== false, // Default to true if not specified
        status: status || 'Active',
      },
    };

    // Only add billing fields if task is billable
    if (payload.task.is_billable) {
      if (billing_rate !== undefined) {
        payload.task.billing_rate = billing_rate.toString();
      }
      if (billing_period) {
        payload.task.billing_period = billing_period;
      }
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.freeagent.com/v2/tasks?project=${project_id}`,
      body: payload,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
