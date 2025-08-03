import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { userIdDropdown } from '../common/props';

export const createTask = createAction({
  auth: biginAuth,
  name: 'createTask',
  displayName: 'Create Task',
  description: 'Create a new task record in Bigin',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Provide the subject or title of the task',
      required: true,
    }),
    owner: userIdDropdown,
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Provide the due date of the task (YYYY-MM-DD format)',
      required: false,
    }),
    recurringActivity: Property.Json({
      displayName: 'Recurring Activity',
      description:
        'Contains the details about the recurrence pattern of the task in the key RRULE. Example: {"RRULE": "FREQ=MONTHLY;INTERVAL=1;BYDAY=MO;UNTIL=2023-09-05"}',
      required: false,
    }),
    remindAt: Property.Json({
      displayName: 'Remind At',
      description:
        'Provide the reminder to notify or prompt members associated with the task in the key ALARM. Example: {"ALARM": "ACTION=EMAIL;TRIGGER=P1D;TRIGGER_TIME=22:45"}',
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
      Subject: context.propsValue.subject,
    };

    // Add optional fields if provided
    if (context.propsValue.owner) body['Owner'] = context.propsValue.owner;
    if (context.propsValue.dueDate)
      body['Due_Date'] = context.propsValue.dueDate;
    if (context.propsValue.recurringActivity)
      body['Recurring_Activity'] = context.propsValue.recurringActivity;
    if (context.propsValue.remindAt)
      body['Remind_At'] = context.propsValue.remindAt;
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

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/Tasks',
      {
        data: [body],
      }
    );

    return {
      message: 'Task created successfully',
      data: response.data[0],
    };
  },
});
