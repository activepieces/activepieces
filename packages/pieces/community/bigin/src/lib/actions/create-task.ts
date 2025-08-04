import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import {
  userIdDropdown,
  contactIdDropdown,
  createRecordIdDropdown,
} from '../common/props';

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
    // Reminder configuration - simplified
    enableReminder: Property.Checkbox({
      displayName: 'Enable Reminder',
      description: 'Enable reminder for this task',
      required: false,
    }),
    reminderAction: Property.StaticDropdown({
      displayName: 'Reminder Action',
      description: 'How the reminder should be shown',
      required: false,
      options: {
        options: [
          { label: 'Email', value: 'EMAIL' },
          { label: 'Popup', value: 'POPUP' },
        ],
      },
    }),
    reminderType: Property.StaticDropdown({
      displayName: 'Reminder Type',
      description: 'When to trigger the reminder',
      required: false,
      options: {
        options: [
          { label: 'Specific Date & Time', value: 'datetime' },
          { label: 'Days Before', value: 'days_before' },
          { label: 'Weeks Before', value: 'weeks_before' },
        ],
      },
    }),
    reminderDateTime: Property.DateTime({
      displayName: 'Reminder Date & Time',
      description:
        'Specific date and time for reminder (for non-recurring tasks)',
      required: false,
    }),
    reminderDaysBefore: Property.Number({
      displayName: 'Days Before',
      description: 'Number of days before the task to send reminder',
      required: false,
    }),
    reminderWeeksBefore: Property.Number({
      displayName: 'Weeks Before',
      description: 'Number of weeks before the task to send reminder',
      required: false,
    }),
    reminderTime: Property.ShortText({
      displayName: 'Reminder Time',
      description:
        'Time for reminder in HH:MM format (24-hour, for recurring tasks)',
      required: false,
    }),
    relatedTo: createRecordIdDropdown(
      'Deals',
      'Related Deal',
      'Select the related deal'
    ),
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
          {
            label: 'Waiting on someone else',
            value: 'Waiting on someone else',
          },
          { label: 'Deferred', value: 'Deferred' },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Provide the list of tags that can be associated with the task',
      required: false,
    }),
  },
  async run(context) {
    // Format due date
    let formattedDueDate: string | undefined;
    if (context.propsValue.dueDate) {
      const dueDate = new Date(context.propsValue.dueDate);
      formattedDueDate = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    const body: Record<string, unknown> = {
      Subject: context.propsValue.subject,
    };

    // Add optional fields if provided
    if (context.propsValue.owner) {
      body['Owner'] = { id: context.propsValue.owner };
    }

    if (formattedDueDate) {
      body['Due_Date'] = formattedDueDate;
    }

    // Handle recurring activity
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

    // Handle reminders
    if (
      context.propsValue.enableReminder &&
      context.propsValue.reminderAction
    ) {
      let alarm = `FREQ=NONE;ACTION=${context.propsValue.reminderAction}`;

      if (
        context.propsValue.reminderType === 'datetime' &&
        context.propsValue.reminderDateTime
      ) {
        const reminderDate = new Date(context.propsValue.reminderDateTime);
        const formattedReminderDate = reminderDate
          .toISOString()
          .replace('.000Z', '+00:00');
        alarm += `;TRIGGER=DATE-TIME:${formattedReminderDate}`;
      } else if (
        context.propsValue.reminderType === 'days_before' &&
        context.propsValue.reminderDaysBefore
      ) {
        alarm += `;TRIGGER=-P${context.propsValue.reminderDaysBefore}D`;
        if (context.propsValue.reminderTime) {
          alarm += `;TRIGGER_TIME=${context.propsValue.reminderTime}`;
        }
      } else if (
        context.propsValue.reminderType === 'weeks_before' &&
        context.propsValue.reminderWeeksBefore
      ) {
        alarm += `;TRIGGER=-P${context.propsValue.reminderWeeksBefore}W`;
        if (context.propsValue.reminderTime) {
          alarm += `;TRIGGER_TIME=${context.propsValue.reminderTime}`;
        }
      }

      body['Remind_At'] = { ALARM: alarm };
    }

    if (context.propsValue.relatedTo) {
      body['Related_To'] = { id: context.propsValue.relatedTo };
    }

    if (context.propsValue.relatedModule) {
      body['$related_module'] = context.propsValue.relatedModule;
    }

    if (context.propsValue.description) {
      body['Description'] = context.propsValue.description;
    }

    if (context.propsValue.priority) {
      body['Priority'] = context.propsValue.priority;
    }

    if (context.propsValue.status) {
      body['Status'] = context.propsValue.status;
    }

    if (context.propsValue.tags && Array.isArray(context.propsValue.tags)) {
      body['Tag'] = context.propsValue.tags;
    }

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/Tasks',
      {
        data: [body],
      }
    );

    return response.data[0];
  },
});
