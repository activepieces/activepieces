import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest, userIdDropdown, pipelineIdDropdown, tagDropdown } from '../common';

export const createTask = createAction({
  auth: biginZohoAuth,
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
      description: 'Provide the due date of the task',
      required: false,
    }),
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
      description: 'Interval for recurrence (e.g., 1 for every week, 2 for every 2 weeks)',
      required: false,
    }),
    recurringUntil: Property.DateTime({
      displayName: 'Recurring Until',
      description: 'End date for recurring task',
      required: false,
    }),
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
      description: 'Specific date and time for reminder',
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
      description: 'Time for reminder in HH:MM format (24-hour)',
      required: false,
    }),
    relatedTo: pipelineIdDropdown,
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
    tag: tagDropdown('Tasks'),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      Subject: context.propsValue.subject,
    };

    if (context.propsValue.owner) body['Owner'] = { id: context.propsValue.owner };
    if (context.propsValue.dueDate) body['Due_Date'] = context.propsValue.dueDate;
    if (context.propsValue.relatedTo) body['Related_To'] = { id: context.propsValue.relatedTo };
    if (context.propsValue.relatedModule) body['$related_module'] = context.propsValue.relatedModule;
    if (context.propsValue.description) body['Description'] = context.propsValue.description;
    if (context.propsValue.priority) body['Priority'] = context.propsValue.priority;
    if (context.propsValue.status) body['Status'] = context.propsValue.status;
    if (context.propsValue.tag) body['Tag'] = context.propsValue.tag;

    if (context.propsValue.isRecurring && context.propsValue.recurringFrequency) {
      let rrule = `FREQ=${context.propsValue.recurringFrequency}`;
      if (context.propsValue.recurringInterval) {
        rrule += `;INTERVAL=${context.propsValue.recurringInterval}`;
      }
      if (context.propsValue.recurringUntil) {
        const untilDate = new Date(context.propsValue.recurringUntil);
        rrule += `;UNTIL=${untilDate.toISOString().split('T')[0]}`;
      }
      body['Recurring_Activity'] = { RRULE: rrule };
    }

    if (context.propsValue.enableReminder) {
      let alarm = `FREQ=NONE;ACTION=${context.propsValue.reminderAction || 'EMAIL'}`;
      
      if (context.propsValue.reminderType === 'datetime' && context.propsValue.reminderDateTime) {
        const reminderDate = new Date(context.propsValue.reminderDateTime);
        alarm += `;TRIGGER=DATE-TIME:${reminderDate.toISOString().replace('Z', '+00:00')}`;
      } else if (context.propsValue.reminderType === 'days_before' && context.propsValue.reminderDaysBefore) {
        alarm += `;TRIGGER=RELATED=START:-P${context.propsValue.reminderDaysBefore}D`;
      } else if (context.propsValue.reminderType === 'weeks_before' && context.propsValue.reminderWeeksBefore) {
        alarm += `;TRIGGER=RELATED=START:-P${context.propsValue.reminderWeeksBefore}W`;
      }
      
      body['Remind_At'] = { ALARM: alarm };
    }

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/Tasks',
      context.auth.props?.['location'] || 'com',
      { data: [body] }
    );

    return response.data[0];
  },
}); 