import { OutputSchema } from '@activepieces/pieces-framework';

const clientFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Client ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'wid', label: 'Workspace ID', format: 'number' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'notes', label: 'Notes' },
  { key: 'external_reference', label: 'External Reference' },
  { key: 'creator_id', label: 'Creator ID', format: 'number' },
  { key: 'at', label: 'Last Updated', format: 'datetime' },
];

const tagFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Tag ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'workspace_id', label: 'Workspace ID', format: 'number' },
  { key: 'creator_id', label: 'Creator ID', format: 'number' },
  { key: 'deleted_at', label: 'Deleted At', format: 'datetime' },
  { key: 'at', label: 'Last Updated', format: 'datetime' },
];

const projectFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Project ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'workspace_id', label: 'Workspace ID', format: 'number' },
  { key: 'client_id', label: 'Client ID', format: 'number' },
  { key: 'client_name', label: 'Client Name' },
  { key: 'status', label: 'Status' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'is_private', label: 'Private', format: 'boolean' },
  { key: 'billable', label: 'Billable', format: 'boolean' },
  { key: 'template', label: 'Template', format: 'boolean' },
  { key: 'pinned', label: 'Pinned', format: 'boolean' },
  { key: 'color', label: 'Color' },
  { key: 'estimated_hours', label: 'Estimated Hours', format: 'number' },
  { key: 'actual_hours', label: 'Tracked Hours', format: 'number' },
  { key: 'actual_seconds', label: 'Tracked Seconds', format: 'number' },
  { key: 'rate', label: 'Hourly Rate', format: 'number' },
  { key: 'fixed_fee', label: 'Fixed Fee', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'start_date', label: 'Start Date', format: 'date' },
  { key: 'end_date', label: 'End Date', format: 'date' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'at', label: 'Last Updated', format: 'datetime' },
];

const taskFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Task ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'workspace_id', label: 'Workspace ID', format: 'number' },
  { key: 'project_id', label: 'Project ID', format: 'number' },
  { key: 'project_name', label: 'Project Name' },
  { key: 'user_id', label: 'User ID', format: 'number' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'estimated_seconds', label: 'Estimated Seconds', format: 'number' },
  { key: 'tracked_seconds', label: 'Tracked Seconds', format: 'number' },
  { key: 'recurring', label: 'Recurring', format: 'boolean' },
  { key: 'at', label: 'Last Updated', format: 'datetime' },
];

const timeEntryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Time Entry ID', format: 'number' },
  { key: 'description', label: 'Description' },
  { key: 'start', label: 'Start', format: 'datetime' },
  { key: 'stop', label: 'Stop', format: 'datetime' },
  {
    key: 'duration',
    label: 'Duration (Seconds)',
    format: 'number',
    description:
      'Duration in seconds. -1 while the timer is running.',
  },
  { key: 'billable', label: 'Billable', format: 'boolean' },
  { key: 'workspace_id', label: 'Workspace ID', format: 'number' },
  { key: 'project_id', label: 'Project ID', format: 'number' },
  { key: 'task_id', label: 'Task ID', format: 'number' },
  { key: 'user_id', label: 'User ID', format: 'number' },
  { key: 'tags', label: 'Tags' },
  { key: 'tag_ids', label: 'Tag IDs' },
  { key: 'at', label: 'Last Updated', format: 'datetime' },
];

const userFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Workspace User ID', format: 'number' },
  { key: 'user_id', label: 'User ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'workspace_id', label: 'Workspace ID', format: 'number' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'admin', label: 'Admin', format: 'boolean' },
  { key: 'role', label: 'Role' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'at', label: 'Last Updated', format: 'datetime' },
];

const workspaceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Workspace ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'organization_id', label: 'Organization ID', format: 'number' },
  { key: 'role', label: 'Role' },
  { key: 'admin', label: 'Admin', format: 'boolean' },
  { key: 'premium', label: 'Premium', format: 'boolean' },
  { key: 'default_currency', label: 'Default Currency' },
  { key: 'default_hourly_rate', label: 'Default Hourly Rate', format: 'number' },
  { key: 'active_project_count', label: 'Active Projects', format: 'number' },
  { key: 'logo_url', label: 'Logo', format: 'image' },
  { key: 'last_modified', label: 'Last Modified', format: 'datetime' },
  { key: 'at', label: 'Last Updated', format: 'datetime' },
];

const reportEntryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Time Entry ID', format: 'number' },
  { key: 'seconds', label: 'Seconds', format: 'number' },
  { key: 'start', label: 'Start', format: 'datetime' },
  { key: 'stop', label: 'Stop', format: 'datetime' },
  { key: 'at', label: 'Last Updated', format: 'datetime' },
];

const reportRowFields: OutputSchema['fields'] = [
  { key: 'description', label: 'Description' },
  { key: 'user_id', label: 'User ID', format: 'number' },
  { key: 'username', label: 'User Name' },
  { key: 'project_id', label: 'Project ID', format: 'number' },
  { key: 'project_name', label: 'Project Name' },
  { key: 'client_name', label: 'Client Name' },
  { key: 'task_id', label: 'Task ID', format: 'number' },
  { key: 'task_name', label: 'Task Name' },
  { key: 'billable', label: 'Billable', format: 'boolean' },
  { key: 'tag_ids', label: 'Tag IDs' },
  { key: 'tag_names', label: 'Tag Names' },
  { key: 'row_number', label: 'Row Number', format: 'number' },
  {
    key: 'time_entries',
    label: 'Time Entries',
    labelKey: 'start',
    listItems: reportEntryFields,
  },
];

const organizationUserFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Organization User ID', format: 'number' },
  { key: 'user_id', label: 'User ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'admin', label: 'Admin', format: 'boolean' },
  { key: 'owner', label: 'Owner', format: 'boolean' },
  { key: 'inactive', label: 'Inactive', format: 'boolean' },
  { key: 'joined', label: 'Joined', format: 'boolean' },
  { key: 'workspace_ids', label: 'Workspace IDs' },
];

const client: OutputSchema = { fields: clientFields };

const clientList: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'clients', label: 'Clients', value: '', listItems: clientFields },
  ],
};

const tag: OutputSchema = { fields: tagFields };

const tagList: OutputSchema = {
  itemLabel: '{name}',
  fields: [{ key: 'tags', label: 'Tags', value: '', listItems: tagFields }],
};

const project: OutputSchema = { fields: projectFields };

const projectList: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'projects', label: 'Projects', value: '', listItems: projectFields },
  ],
};

const task: OutputSchema = { fields: taskFields };

const taskList: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'per_page', label: 'Per Page', format: 'number' },
    {
      key: 'data',
      label: 'Tasks',
      labelKey: 'name',
      listItems: taskFields,
    },
  ],
};

const timeEntry: OutputSchema = { fields: timeEntryFields };

const stoppedTimeEntry: OutputSchema = {
  fields: [
    ...timeEntryFields,
    {
      key: 'success',
      label: 'Success',
      format: 'boolean',
      description: 'Only present (false) when no time entry was running.',
    },
    {
      key: 'message',
      label: 'Message',
      description: 'Only present when no time entry was running.',
    },
  ],
};

const timeEntryList: OutputSchema = {
  itemLabel: '{description}',
  fields: [
    {
      key: 'time_entries',
      label: 'Time Entries',
      value: '',
      listItems: timeEntryFields,
    },
  ],
};

const userList: OutputSchema = {
  itemLabel: '{name}',
  fields: [{ key: 'users', label: 'Users', value: '', listItems: userFields }],
};

const workspace: OutputSchema = { fields: workspaceFields };

const deleted: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'id', label: 'Deleted ID', format: 'number' },
  ],
};

const currentTimeEntry: OutputSchema = {
  fields: [
    {
      key: 'running',
      label: 'Running',
      format: 'boolean',
      description: 'False when no time entry is running; the other fields are then absent.',
    },
    ...timeEntryFields,
  ],
};

const detailedReport: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Rows',
      labelKey: 'description',
      listItems: reportRowFields,
    },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    {
      key: 'next_cursor',
      label: 'Next Page Cursor',
      description: 'Pass back as Next Page Cursor to get the next page.',
    },
  ],
};

const invitation: OutputSchema = {
  fields: [
    { key: 'invitations', label: 'Invitations' },
    { key: 'messages', label: 'Messages' },
  ],
};

const workspaceList: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'workspaces',
      label: 'Workspaces',
      value: '',
      listItems: workspaceFields,
    },
  ],
};

const organizationUserList: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'users',
      label: 'Users',
      value: '',
      listItems: organizationUserFields,
    },
  ],
};

const group: OutputSchema = {
  fields: [
    { key: 'group_id', label: 'Group ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'workspace_ids', label: 'Workspace IDs' },
    { key: 'user_ids', label: 'Member IDs' },
    { key: 'at', label: 'Last Updated', format: 'datetime' },
  ],
};

const projectUser: OutputSchema = {
  fields: [
    { key: 'id', label: 'Project User ID', format: 'number' },
    { key: 'project_id', label: 'Project ID', format: 'number' },
    { key: 'user_id', label: 'User ID', format: 'number' },
    { key: 'workspace_id', label: 'Workspace ID', format: 'number' },
    { key: 'manager', label: 'Manager', format: 'boolean' },
    { key: 'rate', label: 'Hourly Rate', format: 'number' },
    { key: 'at', label: 'Last Updated', format: 'datetime' },
  ],
};

const timeSummary: OutputSchema = {
  fields: [
    { key: 'start_date', label: 'Start Date', format: 'date' },
    { key: 'end_date', label: 'End Date', format: 'date' },
    { key: 'group_by', label: 'Grouped By' },
    { key: 'total_hours', label: 'Total Hours', format: 'number' },
    { key: 'total_seconds', label: 'Total Seconds', format: 'number' },
    {
      key: 'groups',
      label: 'Groups',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'hours', label: 'Hours', format: 'number' },
        { key: 'seconds', label: 'Seconds', format: 'number' },
        { key: 'entry_count', label: 'Entries', format: 'number' },
      ],
    },
  ],
};

export const togglOutputSchemas = {
  timeSummary,
  deleted,
  currentTimeEntry,
  detailedReport,
  invitation,
  workspaceList,
  organizationUserList,
  group,
  projectUser,
  client,
  clientList,
  tag,
  tagList,
  project,
  projectList,
  task,
  taskList,
  timeEntry,
  stoppedTimeEntry,
  timeEntryList,
  userList,
  workspace,
};
