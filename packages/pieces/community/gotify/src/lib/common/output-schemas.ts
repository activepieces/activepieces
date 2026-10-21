import { OutputSchema } from '@activepieces/pieces-framework';

const messageFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Message ID', format: 'number' },
  { key: 'appid', label: 'Application ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'message', label: 'Message' },
  { key: 'priority', label: 'Priority', format: 'number' },
  { key: 'date', label: 'Date', format: 'datetime' },
  { key: 'extras', label: 'Extras', description: 'Gotify extras such as client::display.contentType, when the message has any.' },
];

const applicationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Application ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'defaultPriority', label: 'Default Priority', format: 'number' },
  { key: 'internal', label: 'Internal', format: 'boolean' },
  { key: 'image', label: 'Image Path' },
  { key: 'lastUsed', label: 'Last Used', format: 'datetime' },
];

export const gotifyOutputSchemas = {
  message: { fields: messageFields } satisfies OutputSchema,
  listMessages: {
    fields: [
      { key: 'messages', label: 'Messages', labelKey: 'title', listItems: messageFields },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextSince', label: 'Next Since', format: 'number', description: 'Pass as Since to fetch the next (older) page. Null when there is no more.' },
    ],
  } satisfies OutputSchema,
  deleteMessage: {
    fields: [
      { key: 'id', label: 'Message ID', format: 'number' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'alreadyDeleted', label: 'Already Deleted', format: 'boolean' },
    ],
  } satisfies OutputSchema,
  deleteApplicationMessages: {
    fields: [
      { key: 'applicationId', label: 'Application ID', format: 'number' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
    ],
  } satisfies OutputSchema,
  application: { fields: applicationFields } satisfies OutputSchema,
  createdApplication: {
    fields: [
      ...applicationFields,
      { key: 'token', label: 'App Token', description: 'Secret token of the new application, used to send messages through it.' },
    ],
  } satisfies OutputSchema,
  listApplications: {
    fields: [
      { key: 'applications', label: 'Applications', labelKey: 'name', listItems: applicationFields },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  } satisfies OutputSchema,
  deleteApplication: {
    fields: [
      { key: 'id', label: 'Application ID', format: 'number' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'alreadyDeleted', label: 'Already Deleted', format: 'boolean' },
    ],
  } satisfies OutputSchema,
  listClients: {
    fields: [
      {
        key: 'clients',
        label: 'Clients',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Client ID', format: 'number' },
          { key: 'name', label: 'Name' },
          { key: 'lastUsed', label: 'Last Used', format: 'datetime' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  } satisfies OutputSchema,
  currentUser: {
    fields: [
      { key: 'id', label: 'User ID', format: 'number' },
      { key: 'name', label: 'Name' },
      { key: 'admin', label: 'Admin', format: 'boolean' },
    ],
  } satisfies OutputSchema,
  serverHealth: {
    fields: [
      { key: 'health', label: 'Health' },
      { key: 'database', label: 'Database' },
      { key: 'version', label: 'Version' },
      { key: 'commit', label: 'Commit' },
      { key: 'buildDate', label: 'Build Date' },
    ],
  } satisfies OutputSchema,
};
