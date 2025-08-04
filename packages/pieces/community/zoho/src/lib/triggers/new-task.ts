import { zohoAuth } from '../../index';
import { Property, createTrigger } from '@activepieces/pieces-framework';

export const newTask = createTrigger({
  auth: zohoAuth,
  name: 'new-task',
  displayName: 'New Task',
  description: 'Fires when a task is created in Bigin',
  props: {
    includeTaskDetails: Property.Checkbox({
      displayName: 'Include Task Details',
      description: 'Include complete task information in the trigger payload',
      required: false,
      defaultValue: true,
    }),
    taskTypeFilter: Property.StaticDropdown({
      displayName: 'Task Type Filter',
      description: 'Only trigger for specific task types (optional)',
      required: false,
      options: {
        options: [
          { label: 'Call', value: 'call' },
          { label: 'Email', value: 'email' },
          { label: 'Meeting', value: 'meeting' },
          { label: 'Follow-up', value: 'follow_up' },
          { label: 'Research', value: 'research' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    priorityFilter: Property.StaticDropdown({
      displayName: 'Priority Filter',
      description: 'Only trigger for tasks with specific priority (optional)',
      required: false,
      options: {
        options: [
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' },
        ],
      },
    }),
    statusFilter: Property.StaticDropdown({
      displayName: 'Status Filter',
      description: 'Only trigger for tasks with specific status (optional)',
      required: false,
      options: {
        options: [
          { label: 'Not Started', value: 'not_started' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Deferred', value: 'deferred' },
        ],
      },
    }),
    dueDateFilter: Property.DateTime({
      displayName: 'Due Date Filter',
      description: 'Only trigger for tasks due after this date (optional)',
      required: false,
    }),
    assignedToFilter: Property.ShortText({
      displayName: 'Assigned To Filter',
      description: 'Only trigger for tasks assigned to specific user (optional)',
      required: false,
    }),
  },
  type: 'webhook',
  sampleData: {
    task_id: 'task_123456',
    subject: 'Follow up with client about proposal',
    description: 'Call the client to discuss the proposal details and address any questions',
    task_type: 'call',
    priority: 'high',
    status: 'not_started',
    due_date: '2024-01-20T17:00:00Z',
    assigned_to: 'user@company.com',
    contact_id: 'contact_123',
    company_id: 'company_456',
    deal_id: 'deal_789',
    created_by: 'user@company.com',
    created_at: '2024-01-15T10:30:00Z',
  },
  onEnable: async ({ auth, propsValue }) => {
    // Register webhook for new tasks
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/webhooks/tasks`;
    
    const webhookData = {
      event_type: 'task.created',
      callback_url: '{{webhookUrl}}',
      include_details: propsValue.includeTaskDetails || true,
      filters: {
        task_type: propsValue.taskTypeFilter,
        priority: propsValue.priorityFilter,
        status: propsValue.statusFilter,
        due_date: propsValue.dueDateFilter,
        assigned_to: propsValue.assignedToFilter,
      },
    };

    // Remove null/undefined values from filters
    Object.keys(webhookData.filters).forEach(key => {
      if (webhookData.filters[key as keyof typeof webhookData.filters] === null || 
          webhookData.filters[key as keyof typeof webhookData.filters] === undefined) {
        delete webhookData.filters[key as keyof typeof webhookData.filters];
      }
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to register webhook: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return {
      webhook_id: result.webhook_id,
      secret: result.secret,
    };
  },
  onDisable: async ({ auth, webhookData }) => {
    // Unregister webhook
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/webhooks/tasks/${webhookData.webhook_id}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to unregister webhook: ${response.status} ${response.statusText} - ${errorText}`);
    }
  },
  run: async ({ payload, webhookData }) => {
    // Verify webhook signature if secret is provided
    if (webhookData.secret) {
      // Implement signature verification logic here if needed
    }

    return {
      task_id: payload.task_id,
      subject: payload.subject,
      description: payload.description,
      task_type: payload.task_type,
      priority: payload.priority,
      status: payload.status,
      due_date: payload.due_date,
      assigned_to: payload.assigned_to,
      contact_id: payload.contact_id,
      company_id: payload.company_id,
      deal_id: payload.deal_id,
      created_by: payload.created_by,
      created_at: payload.created_at,
    };
  },
}); 