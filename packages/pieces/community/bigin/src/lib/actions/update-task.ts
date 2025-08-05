import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { taskIdDropdown, userIdDropdown } from '../common/props';

export const updateTask = createAction({
  auth: biginAuth,
  name: 'updateTask',
  displayName: 'Update Task',
  description: 'Update an existing task record in Bigin',
  props: {
    recordId: taskIdDropdown,
    owner: userIdDropdown,
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Provide the subject or title of the task',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Provide the due date of the task (YYYY-MM-DD format)',
      required: false,
    }),
    // Recurring Activity - simplified props for easier configuration
    isRecurring: Property.Checkbox({
      displayName: 'Is Recurring Task',
      description: 'Check if this is a recurring task',
      required: false,
    }),
    recurringFrequency: Property.StaticDropdown({
      displayName: 'Recurring Frequency',
      description: 'How often the task should repeat',
      required: false,
      options: {
        options: [
          { label: 'Daily', value: 'DAILY' },
          { label: 'Weekly', value: 'WEEKLY' },
          { label: 'Monthly', value: 'MONTHLY' },
          { label: 'Yearly', value: 'YEARLY' },
        ],
      },
    }),
    recurringInterval: Property.Number({
      displayName: 'Recurring Interval',
      description:
        'Interval for recurrence (e.g., 1 for every week, 2 for every 2 weeks)',
      required: false,
    }),
    recurringUntil: Property.DateTime({
      displayName: 'Recurring Until',
      description: 'End date for recurring task',
      required: false,
    }),
    relatedTo: Property.Json({
      displayName: 'Related To',
      description:
        'Provide the unique ID of the entity (Contact, Pipeline or Company) that the task is related to',
      required: false,
    }),
    relatedModule: Property.ShortText({
      displayName: 'Related Module',
      description:
        'Provide the type of entity the task is linked to. Use Contacts, Deals or Accounts to match the record in Related_To',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description:
        'Provide additional descriptions or notes related to the task',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Provide the priority level of the task',
      required: false,
      options: {
        options: [
          { label: 'High', value: 'High' },
          { label: 'Medium', value: 'Medium' },
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
          {
            label: 'Waiting on someone else',
            value: 'Waiting on someone else',
          },
          { label: 'Deferred', value: 'Deferred' },
        ],
      },
    }),
    tag: Property.Array({
      displayName: 'Tag',
      description:
        'Provide the list of tags that can be associated with the task. You can get the list of tags from the Get all tags API',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      id: context.propsValue.recordId,
    };

    // Add optional fields if provided
    if (context.propsValue.owner) body['Owner'] = context.propsValue.owner;
    if (context.propsValue.subject)
      body['Subject'] = context.propsValue.subject;
    if (context.propsValue.dueDate)
      body['Due_Date'] = context.propsValue.dueDate;
    
    if (context.propsValue.relatedTo)
      body['Related_To'] = context.propsValue.relatedTo;
    if (context.propsValue.relatedModule)
      body['$related_module'] = context.propsValue.relatedModule;
    if (context.propsValue.description)
      body['Description'] = context.propsValue.description;
    if (context.propsValue.priority)
      body['Priority'] = context.propsValue.priority;
    if (context.propsValue.status) body['Status'] = context.propsValue.status;
    if (context.propsValue.tag) body['Tag'] = context.propsValue.tag;

    if (
      context.propsValue.isRecurring &&
      context.propsValue.recurringFrequency
    ) {
      let rrule = `FREQ=${context.propsValue.recurringFrequency}`;

      if (context.propsValue.recurringInterval) {
        rrule += `;INTERVAL=${context.propsValue.recurringInterval}`;
      }

      if (context.propsValue.recurringUntil) {
        const untilDate = new Date(context.propsValue.recurringUntil);
        rrule += `;UNTIL=${untilDate.toISOString().split('T')[0]}`;
      }

      if (context.propsValue.dueDate) {
        const startDate = new Date(context.propsValue.dueDate);
        rrule += `;DTSTART=${startDate.toISOString().split('T')[0]}`;
      }

      body['Recurring_Activity'] = { RRULE: rrule };
    }

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.PUT,
      '/Tasks',
      context.auth.props?.['location'] || 'com',
      {
        data: [body],
      }
    );

    return response.data[0];
  },
});
