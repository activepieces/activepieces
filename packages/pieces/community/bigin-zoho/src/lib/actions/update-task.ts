import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest } from '../common';
import { BiginZohoAuthType } from '../common/auth';

export const updateTask = createAction({
  auth: biginZohoAuth,
  name: 'updateTask',
  displayName: 'Update Task',
  description: 'Update existing task details',
  props: {
    recordId: Property.Dropdown({
      displayName: 'Task',
      description: 'Select the task to update',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/Tasks',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const tasks = response.data || [];
          return {
            disabled: false,
            options: tasks.map((task: any) => ({
              label: task.Subject,
              value: task.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Provide the subject or title of the task',
      required: false,
    }),
    owner: Property.Dropdown({
      displayName: 'Owner',
      description: 'Select the owner of the task',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/users',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const users = response.users || [];
          return {
            disabled: false,
            options: users.map((user: any) => ({
              label: user.full_name || `${user.first_name} ${user.last_name}`,
              value: user.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Provide the due date of the task',
      required: false,
    }),
    relatedTo: Property.Dropdown({
      displayName: 'Related To',
      description: 'Select the related record',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/Pipelines',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const deals = response.data || [];
          return {
            disabled: false,
            options: deals.map((deal: any) => ({
              label: deal.Deal_Name,
              value: deal.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    relatedModule: Property.StaticDropdown({
      displayName: 'Related Module',
      description: 'The module this task is related to',
      required: false,
      options: {
        options: [
          { label: 'Deals', value: 'Deals' },
          { label: 'Contacts', value: 'Contacts' },
          { label: 'Companies', value: 'Companies' },
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Provide additional descriptions or notes related to the task',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Provide the priority level of the task',
      required: false,
      options: {
        options: [
          { label: 'High', value: 'High' },
          { label: 'Normal', value: 'Normal' },
          { label: 'Low', value: 'Low' },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Provide the current status of the task',
      required: false,
      options: {
        options: [
          { label: 'Not Started', value: 'Not Started' },
          { label: 'In Progress', value: 'In Progress' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Deferred', value: 'Deferred' },
        ],
      },
    }),
    tag: Property.Array({
      displayName: 'Tag',
      description: 'Tags for the task',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      id: context.propsValue.recordId,
    };

    if (context.propsValue.subject) body['Subject'] = context.propsValue.subject;
    if (context.propsValue.owner) body['Owner'] = { id: context.propsValue.owner };
    if (context.propsValue.dueDate) body['Due_Date'] = context.propsValue.dueDate;
    if (context.propsValue.relatedTo) body['Related_To'] = { id: context.propsValue.relatedTo };
    if (context.propsValue.relatedModule) body['$related_module'] = context.propsValue.relatedModule;
    if (context.propsValue.description) body['Description'] = context.propsValue.description;
    if (context.propsValue.priority) body['Priority'] = context.propsValue.priority;
    if (context.propsValue.status) body['Status'] = context.propsValue.status;
    if (context.propsValue.tag && context.propsValue.tag.length > 0) {
      body['Tag'] = context.propsValue.tag.map((tag: unknown) => ({ name: tag as string }));
    }

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.PUT,
      '/Tasks',
      context.auth.props?.['location'] || 'com',
      { data: [body] }
    );

    return response.data[0];
  },
}); 