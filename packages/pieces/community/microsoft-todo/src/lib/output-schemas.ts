import { OutputSchema } from '@activepieces/pieces-framework';

const taskListFields: OutputSchema['fields'] = [
  { key: 'id', label: 'List ID' },
  { key: 'displayName', label: 'Name' },
  { key: 'isOwner', label: 'Owner', format: 'boolean' },
  { key: 'isShared', label: 'Shared', format: 'boolean' },
  { key: 'wellknownListName', label: 'Well-Known List Name' },
];

const taskFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Task ID' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'importance', label: 'Importance' },
  { key: 'body', label: 'Body' },
  { key: 'bodyContentType', label: 'Body Content Type' },
  { key: 'categories', label: 'Categories' },
  { key: 'dueDateTime', label: 'Due Date', format: 'datetime' },
  { key: 'dueTimeZone', label: 'Due Time Zone' },
  { key: 'startDateTime', label: 'Start Date', format: 'datetime' },
  { key: 'startTimeZone', label: 'Start Time Zone' },
  { key: 'reminderDateTime', label: 'Reminder Date', format: 'datetime' },
  { key: 'reminderTimeZone', label: 'Reminder Time Zone' },
  { key: 'isReminderOn', label: 'Reminder On', format: 'boolean' },
  { key: 'completedDateTime', label: 'Completed At', format: 'datetime' },
  { key: 'hasAttachments', label: 'Has Attachments', format: 'boolean' },
  { key: 'recurrence', label: 'Recurrence' },
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
  { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
  { key: 'bodyLastModifiedDateTime', label: 'Body Last Modified At', format: 'datetime' },
];

const checklistItemFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Checklist Item ID' },
  { key: 'displayName', label: 'Name' },
  { key: 'isChecked', label: 'Checked', format: 'boolean' },
  { key: 'checkedDateTime', label: 'Checked At', format: 'datetime' },
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
];

const linkedResourceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Linked Resource ID' },
  { key: 'displayName', label: 'Name' },
  { key: 'applicationName', label: 'Application Name' },
  { key: 'webUrl', label: 'Web URL', format: 'url' },
  { key: 'externalId', label: 'External ID' },
];

const attachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Attachment ID' },
  { key: 'name', label: 'File Name' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
];

const dateTimeTimeZoneFields: OutputSchema['fields'] = [
  { key: 'dateTime', label: 'Date', format: 'datetime' },
  { key: 'timeZone', label: 'Time Zone' },
];

const graphTaskBaseFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Task ID' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'importance', label: 'Importance' },
  { key: 'isReminderOn', label: 'Reminder On', format: 'boolean' },
  { key: 'categories', label: 'Categories' },
  { key: 'hasAttachments', label: 'Has Attachments', format: 'boolean' },
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
  { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
  {
    key: 'body',
    label: 'Body',
    children: [
      { key: 'content', label: 'Content' },
      { key: 'contentType', label: 'Content Type' },
    ],
  },
];

const graphTaskDueFields: OutputSchema['fields'] = [
  ...graphTaskBaseFields,
  { key: 'dueDateTime', label: 'Due Date', children: dateTimeTimeZoneFields },
];

export const taskListOutputSchema: OutputSchema = { fields: taskListFields };

export const microsoftTodoListTaskListsOutputSchema: OutputSchema = {
  fields: [
    { key: 'lists', label: 'Task Lists', labelKey: 'displayName', listItems: taskListFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextPageToken', label: 'Next Page Token' },
  ],
};

export const microsoftTodoDeleteTaskListOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'listId', label: 'List ID' },
  ],
};

export const taskOutputSchema: OutputSchema = { fields: taskFields };

export const microsoftTodoListTasksOutputSchema: OutputSchema = {
  fields: [
    { key: 'tasks', label: 'Tasks', labelKey: 'title', listItems: taskFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextPageToken', label: 'Next Page Token' },
  ],
};

export const microsoftTodoSearchTasksOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tasks',
      label: 'Tasks',
      labelKey: 'title',
      listItems: [
        ...taskFields,
        { key: 'listId', label: 'List ID' },
        { key: 'listName', label: 'List Name' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'truncated', label: 'Truncated', format: 'boolean' },
  ],
};

export const microsoftTodoMoveTaskOutputSchema: OutputSchema = {
  fields: [
    ...taskFields,
    { key: 'listId', label: 'List ID' },
    { key: 'previousListId', label: 'Previous List ID' },
    { key: 'previousTaskId', label: 'Previous Task ID' },
    { key: 'checklistItemCount', label: 'Checklist Items Copied', format: 'number' },
    { key: 'linkedResourceCount', label: 'Linked Resources Copied', format: 'number' },
  ],
};

export const microsoftTodoDeleteTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'listId', label: 'List ID' },
    { key: 'taskId', label: 'Task ID' },
  ],
};

export const checklistItemOutputSchema: OutputSchema = { fields: checklistItemFields };

export const microsoftTodoListChecklistItemsOutputSchema: OutputSchema = {
  fields: [
    { key: 'checklistItems', label: 'Checklist Items', labelKey: 'displayName', listItems: checklistItemFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const microsoftTodoDeleteChecklistItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'listId', label: 'List ID' },
    { key: 'taskId', label: 'Task ID' },
    { key: 'checklistItemId', label: 'Checklist Item ID' },
  ],
};

export const linkedResourceOutputSchema: OutputSchema = { fields: linkedResourceFields };

export const microsoftTodoListLinkedResourcesOutputSchema: OutputSchema = {
  fields: [
    { key: 'linkedResources', label: 'Linked Resources', labelKey: 'displayName', listItems: linkedResourceFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const microsoftTodoDeleteLinkedResourceOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'listId', label: 'List ID' },
    { key: 'taskId', label: 'Task ID' },
    { key: 'linkedResourceId', label: 'Linked Resource ID' },
  ],
};

export const attachmentOutputSchema: OutputSchema = { fields: attachmentFields };

export const microsoftTodoListTaskAttachmentsOutputSchema: OutputSchema = {
  fields: [
    { key: 'attachments', label: 'Attachments', labelKey: 'name', listItems: attachmentFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const microsoftTodoDownloadTaskAttachmentOutputSchema: OutputSchema = {
  fields: [...attachmentFields, { key: 'file', label: 'File' }],
};

export const microsoftTodoDeleteTaskAttachmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'listId', label: 'List ID' },
    { key: 'taskId', label: 'Task ID' },
    { key: 'attachmentId', label: 'Attachment ID' },
  ],
};

export const microsoftTodoGetCurrentUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'User ID' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'givenName', label: 'First Name' },
    { key: 'surname', label: 'Last Name' },
    { key: 'mail', label: 'Email', format: 'email' },
    { key: 'userPrincipalName', label: 'User Principal Name', format: 'email' },
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'preferredLanguage', label: 'Preferred Language' },
  ],
};

export const listTaskListsOutputSchema: OutputSchema = {
  fields: [{ key: 'lists', label: 'Task Lists', value: '', listItems: taskListFields }],
  itemLabel: '{displayName}',
};

export const findTaskListByNameOutputSchema: OutputSchema = {
  fields: [{ key: 'lists', label: 'Matching Task Lists', value: '', listItems: taskListFields }],
  itemLabel: '{displayName}',
};

export const createTaskOutputSchema: OutputSchema = { fields: graphTaskDueFields };

export const completeTaskOutputSchema: OutputSchema = {
  fields: [
    ...graphTaskDueFields,
    { key: 'completedDateTime', label: 'Completed At', children: dateTimeTimeZoneFields },
  ],
};

export const listTasksOutputSchema: OutputSchema = {
  fields: [{ key: 'tasks', label: 'Tasks', value: '', listItems: graphTaskDueFields }],
  itemLabel: '{title}',
};

export const findTaskByTitleOutputSchema: OutputSchema = {
  fields: [{ key: 'tasks', label: 'Matching Tasks', value: '', listItems: graphTaskDueFields }],
  itemLabel: '{title}',
};

export const deleteTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
  ],
};

export const addAttachmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Attachment ID' },
    { key: 'name', label: 'File Name' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
  ],
};

export const newOrUpdatedTaskOutputSchema: OutputSchema = {
  fields: [
    ...graphTaskDueFields,
    { key: 'startDateTime', label: 'Start Date', children: dateTimeTimeZoneFields },
    { key: 'reminderDateTime', label: 'Reminder Date', children: dateTimeTimeZoneFields },
  ],
};

export const taskCompletedOutputSchema: OutputSchema = {
  fields: [
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status' },
    { key: 'importance', label: 'Importance' },
    { key: 'isReminderOn', label: 'Reminder On', format: 'boolean' },
  ],
};
