import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod
} from '@activepieces/pieces-common';

export const createTask = createAction({
  name: 'create_task',
  displayName: 'Create Task',
  description:
    'Creates tasks tied to contacts with due dates and assignment types',
  props: {
    // Required fields
    name: Property.ShortText({
      displayName: 'Task Name',
      description:
        'The name of the task (e.g., "Return Bill\'s call", "Follow up on proposal")',
      required: true
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the task is due (YYYY-MM-DD HH:MM format)',
      required: true
    }),

    // Assignment
    assigned_to: Property.Number({
      displayName: 'Assigned To User ID',
      description: 'The ID of the user who the task is assigned to',
      required: false
    }),

    // Task details
    description: Property.LongText({
      displayName: 'Description',
      description: 'A detailed explanation of the task',
      required: false
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'The priority level of the task',
      required: false,
      defaultValue: 'Medium',
      options: {
        options: [
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' }
        ]
      }
    }),
    complete: Property.Checkbox({
      displayName: 'Mark as Complete',
      description: 'Check if the task should be created as already completed',
      required: false,
      defaultValue: false
    }),

    // Linking options
    link_type: Property.StaticDropdown({
      displayName: 'Link To',
      description: 'What type of record to link this task to',
      required: false,
      options: {
        options: [
          { label: 'Contact', value: 'Contact' },
          { label: 'Project', value: 'Project' },
          { label: 'Opportunity', value: 'Opportunity' }
        ]
      }
    }),
    linked_id: Property.Number({
      displayName: 'Linked Record ID',
      description:
        'The ID of the record to link this task to (Contact, Project, or Opportunity)',
      required: false
    }),
    linked_name: Property.ShortText({
      displayName: 'Linked Record Name',
      description: 'The name of the linked record (for reference)',
      required: false
    }),

    // Category
    category: Property.Number({
      displayName: 'Category ID',
      description: 'The ID of the category this task belongs to',
      required: false
    }),

    // Visibility
    visible_to: Property.StaticDropdown({
      displayName: 'Visible To',
      description: 'Who can view this task',
      required: false,
      defaultValue: 'Everyone',
      options: {
        options: [
          { label: 'Everyone', value: 'Everyone' },
          { label: 'Only Me', value: 'Only Me' },
          { label: 'My Team', value: 'My Team' }
        ]
      }
    }),

    // Due later (for recurring tasks)
    due_later: Property.ShortText({
      displayName: 'Due Later',
      description:
        'Interval for when this task is due after start (e.g., "2 days later at 5:00 PM")',
      required: false
    }),

    // Custom fields
    custom_field_1_id: Property.Number({
      displayName: 'Custom Field 1 ID',
      description: 'ID of the first custom field to set (optional)',
      required: false
    }),
    custom_field_1_value: Property.ShortText({
      displayName: 'Custom Field 1 Value',
      description: 'Value for the first custom field',
      required: false
    }),
    custom_field_2_id: Property.Number({
      displayName: 'Custom Field 2 ID',
      description: 'ID of the second custom field to set (optional)',
      required: false
    }),
    custom_field_2_value: Property.ShortText({
      displayName: 'Custom Field 2 Value',
      description: 'Value for the second custom field',
      required: false
    })
  },

  async run(context) {
    const { auth, propsValue } = context;

    if (!auth) {
      throw new Error('API access token is required');
    }

    // Build the request body
    const requestBody: any = {
      name: propsValue.name,
      due_date: propsValue.due_date
    };

    // Add optional fields if provided
    if (propsValue.assigned_to) {
      requestBody.assigned_to = propsValue.assigned_to;
    }

    if (propsValue.description) {
      requestBody.description = propsValue.description;
    }

    if (propsValue.priority) {
      requestBody.priority = propsValue.priority;
    }

    if (propsValue.complete !== undefined) {
      requestBody.complete = propsValue.complete;
    }

    if (propsValue.category) {
      requestBody.category = propsValue.category;
    }

    if (propsValue.visible_to) {
      requestBody.visible_to = propsValue.visible_to;
    }

    if (propsValue.due_later) {
      requestBody.due_later = propsValue.due_later;
    }

    // Handle linking to records
    if (propsValue.link_type && propsValue.linked_id) {
      requestBody.linked_to = [
        {
          id: propsValue.linked_id,
          type: propsValue.link_type,
          name:
            propsValue.linked_name ||
            `${propsValue.link_type} ${propsValue.linked_id}`
        }
      ];
    }

    // Handle custom fields
    const customFields: any[] = [];

    if (propsValue.custom_field_1_id && propsValue.custom_field_1_value) {
      customFields.push({
        id: propsValue.custom_field_1_id,
        value: propsValue.custom_field_1_value
      });
    }

    if (propsValue.custom_field_2_id && propsValue.custom_field_2_value) {
      customFields.push({
        id: propsValue.custom_field_2_id,
        value: propsValue.custom_field_2_value
      });
    }

    if (customFields.length > 0) {
      requestBody.custom_fields = customFields;
    }

    // Make the API request
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.crmworkspace.com/v1/tasks',
        headers: {
          'ACCESS_TOKEN': auth as string,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      if (response.status >= 400) {
        throw new Error(
          `Wealthbox API error: ${response.status} - ${JSON.stringify(
            response.body
          )}`
        );
      }

      return response.body;
    } catch (error) {
      throw new Error(
        `Failed to create task: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
});
