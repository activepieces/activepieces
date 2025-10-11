import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const createTask = createAction({
  auth: salesforceAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates a new Task in Salesforce',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject of the task',
      required: true,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Task priority',
      required: false,
      options: {
        options: [
          { label: 'High', value: 'High' },
          { label: 'Normal', value: 'Normal' },
          { label: 'Low', value: 'Low' },
        ],
      },
      defaultValue: 'Normal',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Task status',
      required: false,
      options: {
        options: [
          { label: 'Not Started', value: 'Not Started' },
          { label: 'In Progress', value: 'In Progress' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Waiting on someone else', value: 'Waiting on someone else' },
          { label: 'Deferred', value: 'Deferred' },
        ],
      },
      defaultValue: 'Not Started',
    }),
    activityDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date for the task (YYYY-MM-DD format)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the task',
      required: false,
    }),
    whoId: Property.ShortText({
      displayName: 'Who ID',
      description: 'ID of a Lead or Contact related to this task',
      required: false,
    }),
    whatId: Property.ShortText({
      displayName: 'What ID',
      description: 'ID of related object (Account, Opportunity, etc.)',
      required: false,
    }),
    ownerId: Property.ShortText({
      displayName: 'Owner ID',
      description: 'ID of the User who owns this task',
      required: false,
    }),
    reminderDateTime: Property.ShortText({
      displayName: 'Reminder Date Time',
      description: 'Date and time for reminder (ISO 8601 format)',
      required: false,
    }),
    isReminderSet: Property.Checkbox({
      displayName: 'Set Reminder',
      description: 'Whether to set a reminder',
      required: false,
      defaultValue: false,
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Additional custom fields as JSON object',
      required: false,
      defaultValue: {},
    }),
  },
  async run(context) {
    const {
      subject,
      priority,
      status,
      activityDate,
      description,
      whoId,
      whatId,
      ownerId,
      reminderDateTime,
      isReminderSet,
      additionalFields,
    } = context.propsValue;

    const taskData: Record<string, unknown> = {
      Subject: subject,
      ...(priority && { Priority: priority }),
      ...(status && { Status: status }),
      ...(activityDate && { ActivityDate: activityDate }),
      ...(description && { Description: description }),
      ...(whoId && { WhoId: whoId }),
      ...(whatId && { WhatId: whatId }),
      ...(ownerId && { OwnerId: ownerId }),
      ...(isReminderSet !== undefined && { IsReminderSet: isReminderSet }),
      ...(reminderDateTime && { ReminderDateTime: reminderDateTime }),
      ...additionalFields,
    };

    const response = await callSalesforceApi(
      HttpMethod.POST,
      context.auth,
      '/services/data/v56.0/sobjects/Task',
      taskData
    );
    return response.body;
  },
});

