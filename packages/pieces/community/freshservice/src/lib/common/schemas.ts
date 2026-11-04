import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const ticketFields: OutputSchemaField[] = [
  { key: 'id', label: 'Ticket ID', format: 'number' },
  { key: 'subject', label: 'Subject' },
  { key: 'description', label: 'Description', format: 'html' },
  { key: 'description_text', label: 'Description (Text)' },
  { key: 'status', label: 'Status', format: 'number', description: '2 Open, 3 Pending, 4 Resolved, 5 Closed' },
  { key: 'priority', label: 'Priority', format: 'number', description: '1 Low, 2 Medium, 3 High, 4 Urgent' },
  { key: 'source', label: 'Source', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'requester_id', label: 'Requester ID', format: 'number' },
  { key: 'responder_id', label: 'Agent ID', format: 'number' },
  { key: 'group_id', label: 'Group ID', format: 'number' },
  { key: 'department_id', label: 'Department ID', format: 'number' },
  { key: 'category', label: 'Category' },
  { key: 'sub_category', label: 'Sub Category' },
  { key: 'item_category', label: 'Item Category' },
  { key: 'due_by', label: 'Due By', format: 'datetime' },
  { key: 'fr_due_by', label: 'First Response Due By', format: 'datetime' },
  { key: 'is_escalated', label: 'Escalated', format: 'boolean' },
  { key: 'custom_fields', label: 'Custom Fields' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const conversationFields: OutputSchemaField[] = [
  { key: 'id', label: 'Conversation ID', format: 'number' },
  { key: 'body', label: 'Body', format: 'html' },
  { key: 'body_text', label: 'Body (Text)' },
  { key: 'user_id', label: 'Author ID', format: 'number' },
  { key: 'ticket_id', label: 'Ticket ID', format: 'number' },
  { key: 'to_emails', label: 'To' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const requesterFields: OutputSchemaField[] = [
  { key: 'id', label: 'Requester ID', format: 'number' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'primary_email', label: 'Primary Email', format: 'email' },
  { key: 'secondary_emails', label: 'Secondary Emails' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'work_phone_number', label: 'Work Phone' },
  { key: 'mobile_phone_number', label: 'Mobile Phone' },
  { key: 'department_ids', label: 'Department IDs' },
  { key: 'reporting_manager_id', label: 'Reporting Manager ID', format: 'number' },
  { key: 'location_id', label: 'Location ID', format: 'number' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'custom_fields', label: 'Custom Fields' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const changeFields: OutputSchemaField[] = [
  { key: 'id', label: 'Change ID', format: 'number' },
  { key: 'subject', label: 'Subject' },
  { key: 'description', label: 'Description', format: 'html' },
  { key: 'description_text', label: 'Description (Text)' },
  { key: 'status', label: 'Status', format: 'number', description: '1 Open, 2 Planning, 3 Approval, 4 Pending Release, 5 Pending Review, 6 Closed' },
  { key: 'priority', label: 'Priority', format: 'number' },
  { key: 'impact', label: 'Impact', format: 'number' },
  { key: 'risk', label: 'Risk', format: 'number' },
  { key: 'change_type', label: 'Change Type', format: 'number' },
  { key: 'requester_id', label: 'Requester ID', format: 'number' },
  { key: 'agent_id', label: 'Agent ID', format: 'number' },
  { key: 'group_id', label: 'Group ID', format: 'number' },
  { key: 'department_id', label: 'Department ID', format: 'number' },
  { key: 'category', label: 'Category' },
  { key: 'sub_category', label: 'Sub Category' },
  { key: 'item_category', label: 'Item Category' },
  { key: 'planned_start_date', label: 'Planned Start', format: 'datetime' },
  { key: 'planned_end_date', label: 'Planned End', format: 'datetime' },
  { key: 'custom_fields', label: 'Custom Fields' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const taskFields: OutputSchemaField[] = [
  { key: 'id', label: 'Task ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status', format: 'number', description: '1 Open, 2 In Progress, 3 Completed' },
  { key: 'agent_id', label: 'Agent ID', format: 'number' },
  { key: 'group_id', label: 'Group ID', format: 'number' },
  { key: 'due_date', label: 'Due Date', format: 'datetime' },
  { key: 'notify_before', label: 'Notify Before (seconds)', format: 'number' },
  { key: 'planned_start_date', label: 'Planned Start', format: 'datetime' },
  { key: 'planned_end_date', label: 'Planned End', format: 'datetime' },
  { key: 'closed_at', label: 'Closed At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const noteFields: OutputSchemaField[] = [
  { key: 'id', label: 'Note ID', format: 'number' },
  { key: 'body', label: 'Body', format: 'html' },
  { key: 'body_text', label: 'Body (Text)' },
  { key: 'private', label: 'Private', format: 'boolean' },
  { key: 'user_id', label: 'Author ID', format: 'number' },
  { key: 'notify_emails', label: 'Notified Emails' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const agentFields: OutputSchemaField[] = [
  { key: 'id', label: 'Agent ID', format: 'number' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'department_ids', label: 'Department IDs' },
];

const groupFields: OutputSchemaField[] = [
  { key: 'id', label: 'Group ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'members', label: 'Member Agent IDs' },
];

const departmentFields: OutputSchemaField[] = [
  { key: 'id', label: 'Department ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'head_user_id', label: 'Head User ID', format: 'number' },
  { key: 'head_name', label: 'Head Name' },
];

const pageFields: OutputSchemaField[] = [
  { key: 'page', label: 'Page', format: 'number' },
  { key: 'has_more', label: 'Has More', format: 'boolean' },
];

export const freshserviceSchemas: Record<
  | 'ticket'
  | 'ticketWithConversations'
  | 'ticketList'
  | 'conversation'
  | 'requester'
  | 'requesterList'
  | 'change'
  | 'changeList'
  | 'task'
  | 'note'
  | 'agentList'
  | 'groupList'
  | 'departmentList'
  | 'approval'
  | 'deleted',
  OutputSchema
> = {
  ticket: { fields: ticketFields },
  ticketWithConversations: {
    fields: [
      ...ticketFields,
      { key: 'conversations', label: 'Conversations', description: 'Only present when Include Conversations is yes', labelKey: 'body_text', listItems: conversationFields },
    ],
  },
  ticketList: {
    fields: [
      { key: 'tickets', label: 'Tickets', labelKey: 'subject', listItems: ticketFields },
      { key: 'total', label: 'Total Matches', format: 'number' },
      ...pageFields,
    ],
  },
  conversation: { fields: conversationFields },
  requester: { fields: requesterFields },
  requesterList: {
    fields: [
      { key: 'requesters', label: 'Requesters', labelKey: 'primary_email', listItems: requesterFields },
      ...pageFields,
    ],
  },
  change: { fields: changeFields },
  changeList: {
    fields: [
      { key: 'changes', label: 'Changes', labelKey: 'subject', listItems: changeFields },
      ...pageFields,
    ],
  },
  task: { fields: taskFields },
  note: { fields: noteFields },
  agentList: {
    fields: [
      { key: 'agents', label: 'Agents', labelKey: 'email', listItems: agentFields },
      ...pageFields,
    ],
  },
  groupList: {
    fields: [
      { key: 'groups', label: 'Groups', labelKey: 'name', listItems: groupFields },
      ...pageFields,
    ],
  },
  departmentList: {
    fields: [
      { key: 'departments', label: 'Departments', labelKey: 'name', listItems: departmentFields },
      ...pageFields,
    ],
  },
  approval: {
    fields: [
      { key: 'id', label: 'Approval ID', format: 'number' },
      { key: 'approver_id', label: 'Approver ID', format: 'number' },
      { key: 'approval_status', label: 'Approval Status' },
      { key: 'approval_type', label: 'Approval Type', format: 'number' },
      { key: 'level', label: 'Level', format: 'number' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    ],
  },
  deleted: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'id', label: 'Deleted ID', format: 'number' },
    ],
  },
};
