import { zohoAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const createTask = createAction({
  auth: zohoAuth,
  name: 'create-task',
  displayName: 'Create Task',
  description: 'Add a task to a record in Bigin',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject or title of the task',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or details of the task',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Due date and time for the task',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Priority level of the task',
      required: true,
      options: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Status of the task',
      required: true,
      options: {
        options: [
          { label: 'Not Started', value: 'not_started' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Deferred', value: 'deferred' },
          { label: 'Waiting on Someone Else', value: 'waiting_on_someone_else' },
        ],
      },
    }),
    taskType: Property.StaticDropdown({
      displayName: 'Task Type',
      description: 'Type of task',
      required: true,
      options: {
        options: [
          { label: 'Call', value: 'call' },
          { label: 'Email', value: 'email' },
          { label: 'Meeting', value: 'meeting' },
          { label: 'Follow Up', value: 'follow_up' },
          { label: 'Research', value: 'research' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact related to this task',
      required: false,
    }),
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'ID of the company related to this task',
      required: false,
    }),
    dealId: Property.ShortText({
      displayName: 'Deal ID',
      description: 'ID of the deal/pipeline record related to this task',
      required: false,
    }),
    assignedTo: Property.ShortText({
      displayName: 'Assigned To',
      description: 'User ID or email of the person assigned to this task',
      required: false,
    }),
    reminder: Property.StaticDropdown({
      displayName: 'Reminder',
      description: 'Reminder time before the due date',
      required: false,
      options: {
        options: [
          { label: 'No Reminder', value: 'none' },
          { label: '15 minutes before', value: '15' },
          { label: '30 minutes before', value: '30' },
          { label: '1 hour before', value: '60' },
          { label: '1 day before', value: '1440' },
        ],
      },
    }),
  },
  run: async ({ auth, propsValue }) => {
    const {
      subject,
      description,
      dueDate,
      priority,
      status,
      taskType,
      contactId,
      companyId,
      dealId,
      assignedTo,
      reminder,
    } = propsValue;

    // Construct the API endpoint
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/tasks`;

    const taskData = {
      subject,
      description,
      due_date: dueDate,
      priority,
      status,
      task_type: taskType,
      contact_id: contactId,
      company_id: companyId,
      deal_id: dealId,
      assigned_to: assignedTo,
      reminder,
    };

    // Remove null/undefined values
    Object.keys(taskData).forEach(key => {
      if (taskData[key as keyof typeof taskData] === null || taskData[key as keyof typeof taskData] === undefined) {
        delete taskData[key as keyof typeof taskData];
      }
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create task: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  },
}); 