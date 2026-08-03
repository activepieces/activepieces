import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const taskFields: OutputSchemaField[] = [
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'id', label: 'Task ID' },
  { key: 'notes', label: 'Notes' },
  { key: 'due', label: 'Due Date', format: 'date' },
  { key: 'completed', label: 'Completed At', format: 'datetime' },
  { key: 'updated', label: 'Updated At', format: 'datetime' },
  { key: 'parent', label: 'Parent Task ID' },
  { key: 'position', label: 'Position' },
  { key: 'webViewLink', label: 'Task Link', format: 'url' },
];

const taskListFields: OutputSchemaField[] = [
  { key: 'title', label: 'Title' },
  { key: 'id', label: 'Task List ID' },
  { key: 'updated', label: 'Updated At', format: 'datetime' },
];

export const googleTasksGetTaskOutputSchema: OutputSchema = {
  fields: taskFields,
};

export const googleTasksCompleteTaskOutputSchema: OutputSchema = {
  fields: taskFields,
};

export const googleTasksCreateTaskOutputSchema: OutputSchema = {
  fields: taskFields,
};

export const googleTasksMoveTaskOutputSchema: OutputSchema = {
  fields: taskFields,
};

export const googleTasksUpdateTaskOutputSchema: OutputSchema = {
  fields: taskFields,
};

export const googleTasksAddTaskOutputSchema: OutputSchema = {
  fields: [{ key: 'body', label: 'Task', value: 'body', children: taskFields }],
};

export const googleTasksFindTasksOutputSchema: OutputSchema = {
  fields: [
    { key: 'tasks', label: 'Tasks', listItems: taskFields, labelKey: 'title' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const googleTasksListTaskListsOutputSchema: OutputSchema = {
  fields: [
    { key: 'taskLists', label: 'Task Lists', listItems: taskListFields, labelKey: 'title' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const googleTasksClearCompletedTasksOutputSchema: OutputSchema = {
  fields: [{ key: 'cleared', label: 'Cleared', format: 'boolean' }],
};

export const googleTasksDeleteTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'alreadyAbsent', label: 'Already Absent', format: 'boolean' },
  ],
};

export const googleTasksNewTaskTriggerOutputSchema: OutputSchema = {
  fields: taskFields,
};
