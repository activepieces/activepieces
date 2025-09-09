import { Property } from '@activepieces/pieces-framework';

export const taskId = Property.ShortText({
  displayName: 'Task ID',
  description: 'The unique identifier for the Task. Required for operations like fetching, updating, or deleting a specific task.',
  required: true,
});

export const taskName = Property.ShortText({
  displayName: 'Name',
  description: 'The name of the Task.',
  required: true,
});

export const taskRelatedResource = Property.Array({
  displayName: 'Related Resource',
  description: 'The primary resource related to this Task (e.g., a project).',
  required: false,
  properties: {
    id: Property.ShortText({
      displayName: 'Resource ID',
      description: 'Unique identifier for the related resource.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Resource Type',
      description: 'The type of the related resource (e.g., project).',
      required: true,
      options: {
        options: [
          { label: 'Project', value: 'project' },
        ],
      },
    }),
  },
});

export const taskAssigneeId = Property.ShortText({
  displayName: 'Assignee ID',
  description: 'The unique identifier of the User that will own the Task.',
  required: false,
});

export const taskDueDate = Property.DateTime({
  displayName: 'Due Date',
  description: 'The date and time by which the Task is due. This will be converted to a Unix timestamp for the API.',
  required: false,
});

export const taskReminderDate = Property.DateTime({
  displayName: 'Reminder Date',
  description: 'The date and time to receive a reminder about the Task. This will be converted to a Unix timestamp for the API.',
  required: false,
});

export const taskPriority = Property.StaticDropdown({
  displayName: 'Priority',
  description: 'The priority level of the Task.',
  required: false,
  options: {
    options: [
      { label: 'None', value: 'None' },
      { label: 'Low', value: 'Low' },
      { label: 'Medium', value: 'Medium' },
      { label: 'High', value: 'High' },
    ],
  },
});

export const taskStatus = Property.StaticDropdown({
  displayName: 'Status',
  description: 'The current status of the Task.',
  required: false,
  options: {
    options: [
      { label: 'Open', value: 'Open' },
      { label: 'Completed', value: 'Completed' },
    ],
  },
});

export const taskDetails = Property.LongText({
  displayName: 'Details',
  description: 'A comprehensive description of the Task.',
  required: false,
});

export const taskTags = Property.Array({
  displayName: 'Tags',
  description: 'An array of tags to associate with the Task.',
  required: false,
});

export const taskCustomFields = Property.Array({
  displayName: 'Custom Fields',
  description: 'An array of custom field values belonging to the Task.',
  required: false,
  properties: {
    custom_field_definition_id: Property.ShortText({
      displayName: 'Definition ID',
      description: 'The ID of the Custom Field Definition.',
      required: true,
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'The value of the Custom Field. This can be a number, string, option ID, or timestamp.',
      required: true,
    }),
  },
});