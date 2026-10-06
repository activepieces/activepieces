import { Property } from '@activepieces/pieces-framework';

function listId() {
  return Property.ShortText({
    displayName: 'Task List ID',
    description: 'ID of the task list, from List Task Lists or Create Task List.',
    required: true,
  });
}

function taskId() {
  return Property.ShortText({
    displayName: 'Task ID',
    description: 'ID of the task, from List Tasks or Create Task.',
    required: true,
  });
}

function checklistItemId() {
  return Property.ShortText({
    displayName: 'Checklist Item ID',
    description: 'ID of the checklist item, from List Checklist Items or Add Checklist Item.',
    required: true,
  });
}

function linkedResourceId() {
  return Property.ShortText({
    displayName: 'Linked Resource ID',
    description: 'ID of the linked resource, from List Linked Resources or Create Linked Resource.',
    required: true,
  });
}

function attachmentId() {
  return Property.ShortText({
    displayName: 'Attachment ID',
    description: 'ID of the attachment, from List Task Attachments or Upload Task Attachment.',
    required: true,
  });
}

function pageToken() {
  return Property.ShortText({
    displayName: 'Page Token',
    description: 'The nextPageToken returned by the previous call. Leave empty for the first page.',
    required: false,
  });
}

function limit() {
  return Property.Number({
    displayName: 'Limit',
    description: 'Maximum number of results per page (1-100). Defaults to 50.',
    required: false,
  });
}

export const todoProps = {
  listId,
  taskId,
  checklistItemId,
  linkedResourceId,
  attachmentId,
  pageToken,
  limit,
};
