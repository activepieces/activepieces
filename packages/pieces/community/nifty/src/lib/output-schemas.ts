import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const taskFields: OutputSchemaField[] = [
  { key: 'id', label: 'Task ID' },
  { key: 'nice_id', label: 'Task Key', description: 'Short project-prefixed key shown in Nifty, e.g. ANP-1.' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'project', label: 'Project ID' },
  { key: 'task_group', label: 'Status ID', description: 'The status (board column) the task is in.' },
  { key: 'milestone', label: 'Milestone or List ID', description: 'Not present on subtasks.' },
  { key: 'task', label: 'Parent Task ID', description: 'Only present on subtasks.' },
  { key: 'completed', label: 'Completed', format: 'boolean' },
  { key: 'completed_on', label: 'Completed On', format: 'datetime', description: 'Only present on completed tasks.' },
  { key: 'completed_by', label: 'Completed By (Member ID)', description: 'Only present on completed tasks.' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'start_date', label: 'Start Date', format: 'datetime' },
  { key: 'due_date', label: 'Due Date', format: 'datetime' },
  { key: 'story_points', label: 'Story Points' },
  { key: 'assignees', label: 'Assignee IDs' },
  { key: 'labels', label: 'Label IDs' },
  { key: 'subscribers', label: 'Subscriber IDs' },
  { key: 'total_subtasks', label: 'Subtasks', format: 'number', description: 'Not present on subtasks.' },
  { key: 'completed_subtasks', label: 'Completed Subtasks', format: 'number', description: 'Not present on subtasks.' },
  { key: 'comments', label: 'Comments', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'created_by', label: 'Created By (Member ID)' },
];

const projectFields: OutputSchemaField[] = [
  { key: 'id', label: 'Project ID' },
  { key: 'nice_id', label: 'Project Key' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'subteam', label: 'Portfolio ID' },
  { key: 'access_type', label: 'Access Type' },
  { key: 'default_tasks_view', label: 'Default Tasks View' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'owner', label: 'Owner (Member ID)' },
  { key: 'progress', label: 'Progress', format: 'number', description: 'Share of completed tasks, from 0 to 1.' },
  { key: 'total_story_points', label: 'Total Story Points', format: 'number' },
  { key: 'completed_story_points', label: 'Completed Story Points', format: 'number' },
  { key: 'email', label: 'Project Email', format: 'email', description: 'Email address that forwards messages into the project discussion.' },
  { key: 'color', label: 'Color' },
];

const milestoneFields: OutputSchemaField[] = [
  { key: 'id', label: 'Milestone or List ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'is_list', label: 'Is Plain List', format: 'boolean', description: 'True for a task list without dates, false for a dated milestone.' },
  { key: 'project', label: 'Project ID' },
  { key: 'start', label: 'Start', format: 'datetime' },
  { key: 'end', label: 'End', format: 'datetime' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'created_by', label: 'Created By (Member ID)' },
  {
    key: 'statistic',
    label: 'Task Statistics',
    children: [
      { key: 'total', label: 'Total Tasks', format: 'number' },
      { key: 'completed', label: 'Completed Tasks', format: 'number' },
      { key: 'overdue', label: 'Overdue Tasks', format: 'number' },
    ],
  },
];

const statusFields: OutputSchemaField[] = [
  { key: 'id', label: 'Status ID' },
  { key: 'name', label: 'Name' },
  { key: 'project', label: 'Project ID' },
  { key: 'order', label: 'Order', format: 'number' },
  { key: 'color', label: 'Color' },
];

const memberFields: OutputSchemaField[] = [
  { key: 'id', label: 'Member ID', description: 'Use this ID for assignees.' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'initials', label: 'Initials' },
  { key: 'role', label: 'Role' },
  { key: 'pending', label: 'Invite Pending', format: 'boolean' },
  { key: 'removed', label: 'Removed', format: 'boolean' },
];

export const taskOutputSchema: OutputSchema = { fields: taskFields };

export const createTaskArrayOutputSchema: OutputSchema = {
  fields: [{ key: 'task', label: 'Created Task', value: '', listItems: taskFields }],
  itemLabel: '{name}',
};

export const projectOutputSchema: OutputSchema = { fields: projectFields };

export const milestoneOutputSchema: OutputSchema = { fields: milestoneFields };

export const deleteTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Deleted Task ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'message', label: 'Message' },
  ],
};

export const assigneesOutputSchema: OutputSchema = {
  fields: [
    { key: 'task_id', label: 'Task ID' },
    { key: 'member_ids', label: 'Member IDs Sent' },
    { key: 'task', label: 'Task (after the change)', children: taskFields },
  ],
};

export const findTasksOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Tasks', labelKey: 'name', listItems: taskFields },
    { key: 'has_more', label: 'More Pages', format: 'boolean', description: 'True when this page was full. Call again with next_offset to read the next page; the next page can be empty.' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};

export const findProjectsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Projects', labelKey: 'name', listItems: projectFields },
    { key: 'truncated', label: 'Truncated', format: 'boolean', description: 'True when the workspace has more projects than one call can read; narrow with a portfolio.' },
  ],
};

export const listStatusesOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Statuses', labelKey: 'name', listItems: statusFields }],
};

export const listMilestonesOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Milestones and Lists', labelKey: 'name', listItems: milestoneFields }],
};

export const listMembersOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Members', labelKey: 'name', listItems: memberFields }],
};
