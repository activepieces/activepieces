import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const createTask = createAction({
  auth: copperAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Adds a new task under a person, lead, or opportunity.',
  props: {
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'Name of the task',
      required: true,
    }),
    relatedResourceId: Property.Number({
      displayName: 'Related Resource ID',
      description: 'ID of the related resource (person, lead, opportunity, or project)',
      required: false,
    }),
    relatedResourceType: Property.StaticDropdown({
      displayName: 'Related Resource Type',
      description: 'Type of the related resource',
      required: false,
      defaultValue: 'person',
      options: {
        disabled: false,
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Lead', value: 'lead' },
          { label: 'Opportunity', value: 'opportunity' },
          { label: 'Project', value: 'project' },
        ],
      },
    }),
    assigneeId: Property.Number({
      displayName: 'Assignee ID',
      description: 'ID of the user assigned to this task',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date in YYYY-MM-DD format or Unix timestamp',
      required: false,
    }),
    reminderDate: Property.ShortText({
      displayName: 'Reminder Date',
      description: 'Reminder date in YYYY-MM-DD format or Unix timestamp',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Priority level for this task',
      required: false,
      defaultValue: 'None',
      options: {
        disabled: false,
        options: [
          { label: 'None', value: 'None' },
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Status of the task',
      required: false,
      defaultValue: 'Open',
      options: {
        disabled: false,
        options: [
          { label: 'Open', value: 'Open' },
          { label: 'Completed', value: 'Completed' },
        ],
      },
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Additional details about the task',
      required: false,
    }),
    customField1Id: Property.Number({
      displayName: 'Custom Field 1 ID',
      description: 'ID of the first custom field definition',
      required: false,
    }),
    customField1Value: Property.ShortText({
      displayName: 'Custom Field 1 Value',
      description: 'Value for the first custom field',
      required: false,
    }),
    customField2Id: Property.Number({
      displayName: 'Custom Field 2 ID',
      description: 'ID of the second custom field definition',
      required: false,
    }),
    customField2Value: Property.ShortText({
      displayName: 'Custom Field 2 Value',
      description: 'Value for the second custom field',
      required: false,
    }),
    customField3Id: Property.Number({
      displayName: 'Custom Field 3 ID',
      description: 'ID of the third custom field definition',
      required: false,
    }),
    customField3Value: Property.ShortText({
      displayName: 'Custom Field 3 Value',
      description: 'Value for the third custom field',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      relatedResourceId,
      relatedResourceType,
      assigneeId,
      dueDate,
      reminderDate,
      priority,
      status,
      details,
      customField1Id,
      customField1Value,
      customField2Id,
      customField2Value,
      customField3Id,
      customField3Value,
    } = context.propsValue;

    // Build the request body
    const requestBody: any = {
      name: name,
    };

    // Add related resource if provided
    if (relatedResourceId && relatedResourceType) {
      requestBody.related_resource = {
        id: relatedResourceId,
        type: relatedResourceType,
      };
    }

    // Add optional fields if provided
    if (assigneeId) {
      requestBody.assignee_id = assigneeId;
    }
    if (dueDate) {
      // Check if it's a Unix timestamp or date string
      if (/^\d+$/.test(dueDate)) {
        requestBody.due_date = parseInt(dueDate);
      } else {
        // Convert date string to Unix timestamp
        requestBody.due_date = Math.floor(new Date(dueDate).getTime() / 1000);
      }
    }
    if (reminderDate) {
      // Check if it's a Unix timestamp or date string
      if (/^\d+$/.test(reminderDate)) {
        requestBody.reminder_date = parseInt(reminderDate);
      } else {
        // Convert date string to Unix timestamp
        requestBody.reminder_date = Math.floor(new Date(reminderDate).getTime() / 1000);
      }
    }
    if (priority && priority !== 'None') {
      requestBody.priority = priority;
    }
    if (status && status !== 'Open') {
      requestBody.status = status;
    }
    if (details) {
      requestBody.details = details;
    }

    // Add custom fields if provided
    const customFields = [];
    if (customField1Id && customField1Value) {
      customFields.push({
        custom_field_definition_id: customField1Id,
        value: customField1Value,
      });
    }
    if (customField2Id && customField2Value) {
      customFields.push({
        custom_field_definition_id: customField2Id,
        value: customField2Value,
      });
    }
    if (customField3Id && customField3Value) {
      customFields.push({
        custom_field_definition_id: customField3Id,
        value: customField3Value,
      });
    }

    if (customFields.length > 0) {
      requestBody.custom_fields = customFields;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/tasks',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
        body: requestBody,
      });

      return response.body;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(`Bad request: ${JSON.stringify(error.response.body)}`);
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your credentials.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access forbidden. Please check your permissions.');
      }
      throw new Error(`Error creating task: ${error.message}`);
    }
  },
});
