import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest, BiginTask } from '../common';

export const createTask = createAction({
  auth: biginZohoAuth,
  name: 'bigin_create_task',
  displayName: 'Create Task',
  description: 'Add a task to a record in Bigin',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Task subject/title',
      required: true,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date for the task (YYYY-MM-DD format)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Not Started', value: 'Not Started' },
          { label: 'In Progress', value: 'In Progress' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Pending Input', value: 'Pending Input' },
          { label: 'Deferred', value: 'Deferred' },
        ],
      },
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      options: {
        options: [
          { label: 'High', value: 'High' },
          { label: 'Highest', value: 'Highest' },
          { label: 'Low', value: 'Low' },
          { label: 'Lowest', value: 'Lowest' },
          { label: 'Normal', value: 'Normal' },
        ],
      },
    }),
    relatedTo: Property.ShortText({
      displayName: 'Related To (What ID)',
      description: 'ID of the related record (Account, Deal, etc.)',
      required: false,
    }),
    relatedContact: Property.ShortText({
      displayName: 'Related Contact (Who ID)',
      description: 'ID of the related contact',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Task description and details',
      required: false,
    }),
  },
  async run(context) {
    const {
      subject,
      dueDate,
      status,
      priority,
      relatedTo,
      relatedContact,
      description,
    } = context.propsValue;

    const taskData: Partial<BiginTask> = {
      Subject: subject,
    };

    // Add optional fields if provided
    if (dueDate) taskData.Due_Date = dueDate;
    if (status) taskData.Status = status;
    if (priority) taskData.Priority = priority;
    if (relatedTo) {
      taskData.What_Id = { id: relatedTo };
    }
    if (relatedContact) {
      taskData.Who_Id = { id: relatedContact };
    }
    if (description) taskData.Description = description;

    const requestBody = {
      data: [taskData],
    };

    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      '/Tasks',
      requestBody
    );

    return response;
  },
}); 