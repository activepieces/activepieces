import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const personFields: OutputSchemaField[] = [
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'type', label: 'Type', description: 'user, customer or team.' },
  { key: 'first', label: 'First Name' },
  { key: 'last', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'photoUrl', label: 'Photo URL', format: 'url', description: 'Present only when set.' },
];

const tagFields: OutputSchemaField[] = [
  { key: 'id', label: 'Tag ID', format: 'number' },
  { key: 'tag', label: 'Tag' },
  { key: 'color', label: 'Color' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const threadFields: OutputSchemaField[] = [
  { key: 'id', label: 'Thread ID', format: 'number' },
  { key: 'type', label: 'Type', description: 'customer, message, note, chat, phone, lineitem, forwardparent, forwardchild, beaconchat.' },
  { key: 'status', label: 'Status' },
  { key: 'state', label: 'State', description: 'published, draft, underreview or hidden.' },
  { key: 'body', label: 'Body', format: 'html' },
  { key: 'source', label: 'Source', children: [{ key: 'type', label: 'Type' }, { key: 'via', label: 'Via' }] },
  { key: 'customer', label: 'Customer', children: personFields },
  { key: 'createdBy', label: 'Created By', children: personFields },
  { key: 'assignedTo', label: 'Assigned To', children: personFields },
  { key: 'to', label: 'To' },
  { key: 'cc', label: 'CC' },
  { key: 'bcc', label: 'BCC' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'openedAt', label: 'Opened At', format: 'datetime', description: 'Present only when the customer opened the email.' },
  { key: 'action', label: 'Action', children: [{ key: 'type', label: 'Type' }, { key: 'text', label: 'Text' }, { key: 'associatedEntities', label: 'Associated Entities', description: 'IDs of records linked to the action, for example the merged conversation.' }] },
  { key: '_embedded', label: 'Embedded', children: [{ key: 'attachments', label: 'Attachments', labelKey: 'filename', listItems: [{ key: 'id', label: 'ID', format: 'number' }, { key: 'filename', label: 'File Name' }, { key: 'mimeType', label: 'MIME Type' }, { key: 'size', label: 'Size', format: 'filesize' }] }] },
];

const conversationFields: OutputSchemaField[] = [
  { key: 'id', label: 'Conversation ID', format: 'number' },
  { key: 'number', label: 'Conversation Number', format: 'number' },
  { key: 'threads', label: 'Thread Count', format: 'number' },
  { key: 'type', label: 'Type', description: 'email, chat or phone.' },
  { key: 'folderId', label: 'Folder ID', format: 'number' },
  { key: 'status', label: 'Status', description: 'active, pending, closed or spam.' },
  { key: 'state', label: 'State', description: 'draft, published or deleted.' },
  { key: 'subject', label: 'Subject' },
  { key: 'preview', label: 'Preview' },
  { key: 'mailboxId', label: 'Mailbox ID', format: 'number' },
  { key: 'assignee', label: 'Assignee', description: 'Present only when assigned.', children: personFields },
  { key: 'createdBy', label: 'Created By', children: personFields },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'closedAt', label: 'Closed At', format: 'datetime', description: 'Present only when closed.' },
  { key: 'closedByUser', label: 'Closed By User', description: 'Present only when closed.', children: personFields },
  { key: 'closedBy', label: 'Closed By User ID', format: 'number' },
  { key: 'userUpdatedAt', label: 'User Updated At', format: 'datetime' },
  { key: 'customerWaitingSince', label: 'Customer Waiting Since', children: [{ key: 'time', label: 'Time', format: 'datetime' }, { key: 'friendly', label: 'Friendly' }] },
  { key: 'source', label: 'Source', children: [{ key: 'type', label: 'Type' }, { key: 'via', label: 'Via' }] },
  { key: 'tags', label: 'Tags', labelKey: 'tag', listItems: tagFields },
  { key: 'cc', label: 'CC' },
  { key: 'bcc', label: 'BCC' },
  { key: 'primaryCustomer', label: 'Primary Customer', children: personFields },
  { key: 'customFields', label: 'Custom Fields', labelKey: 'name', listItems: [{ key: 'id', label: 'ID', format: 'number' }, { key: 'name', label: 'Name' }, { key: 'value', label: 'Value' }, { key: 'text', label: 'Text' }] },
];

const customerFields: OutputSchemaField[] = [
  { key: 'id', label: 'Customer ID', format: 'number' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'gender', label: 'Gender' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'location', label: 'Location' },
  { key: 'organization', label: 'Organization' },
  { key: 'photoUrl', label: 'Photo URL', format: 'url', description: 'Present only when set.' },
  { key: 'photoType', label: 'Photo Type' },
  { key: 'organizationId', label: 'Organization ID', format: 'number' },
  { key: 'conversationCount', label: 'Conversation Count', format: 'number' },
  { key: 'draft', label: 'Draft', format: 'boolean' },
  { key: 'background', label: 'Background' },
  { key: 'age', label: 'Age' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  { key: '_embedded', label: 'Embedded', description: 'Emails, phones, social profiles, websites, address.', children: [
    { key: 'emails', label: 'Emails', labelKey: 'value', listItems: [{ key: 'id', label: 'ID', format: 'number' }, { key: 'value', label: 'Email', format: 'email' }, { key: 'type', label: 'Type' }] },
    { key: 'phones', label: 'Phones', labelKey: 'value', listItems: [{ key: 'id', label: 'ID', format: 'number' }, { key: 'value', label: 'Phone' }, { key: 'type', label: 'Type' }] },
    { key: 'chats', label: 'Chats', labelKey: 'value', listItems: [{ key: 'id', label: 'ID', format: 'number' }, { key: 'value', label: 'Handle' }, { key: 'type', label: 'Type' }] },
    { key: 'websites', label: 'Websites', labelKey: 'value', listItems: [{ key: 'id', label: 'ID', format: 'number' }, { key: 'value', label: 'URL', format: 'url' }] },
    { key: 'properties', label: 'Properties', labelKey: 'name', listItems: [{ key: 'slug', label: 'Slug' }, { key: 'name', label: 'Name' }, { key: 'value', label: 'Value' }, { key: 'text', label: 'Text' }] },
    { key: 'address', label: 'Address', children: [{ key: 'city', label: 'City' }, { key: 'state', label: 'State' }, { key: 'postalCode', label: 'Postal Code' }, { key: 'country', label: 'Country' }, { key: 'lines', label: 'Lines' }] },
    { key: 'social_profiles', label: 'Social Profiles', labelKey: 'value', listItems: [{ key: 'value', label: 'URL', format: 'url' }, { key: 'type', label: 'Type' }] },
  ] },
];

const userFields: OutputSchemaField[] = [
  { key: 'id', label: 'User ID', format: 'number' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'role', label: 'Role' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'type', label: 'Type', description: 'user or team.' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'mention', label: 'Mention Handle' },
  { key: 'initials', label: 'Initials' },
  { key: 'phone', label: 'Phone' },
  { key: 'alternateEmails', label: 'Alternate Emails' },
  { key: 'lastVisit', label: 'Last Visit', format: 'datetime' },
  { key: 'photoUrl', label: 'Photo URL', format: 'url', description: 'Present only when set.' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const mailboxFields: OutputSchemaField[] = [
  { key: 'id', label: 'Mailbox ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const conversationLinksField: OutputSchemaField = {
  key: '_links',
  label: 'Links',
  children: [{ key: 'web', label: 'Web', children: [{ key: 'href', label: 'Web URL', description: 'Opens the conversation in Help Scout.' }] }],
};

const idOnly: OutputSchema = {
  fields: [{ key: 'id', label: 'ID', description: 'From the Resource-ID response header.' }],
};

export const helpScoutOutputSchemas: Record<string, OutputSchema> = {
  createdId: idOnly,
  conversation: { fields: [...conversationFields, { key: '_embedded', label: 'Embedded', children: [{ key: 'threads', label: 'Threads', labelKey: 'type', listItems: threadFields }] }] },
  customer: { fields: customerFields },
  findConversation: { fields: [{ key: 'found', label: 'Found', format: 'boolean' }, { key: 'data', label: 'Conversation', children: conversationFields }] },
  findCustomer: { fields: [{ key: 'found', label: 'Found', format: 'boolean' }, { key: 'data', label: 'Customer', children: customerFields }] },
  findUser: { fields: [{ key: 'found', label: 'Found', format: 'boolean' }, { key: 'data', label: 'User', children: userFields }] },
  updateCustomerProperties: { fields: [{ key: 'success', label: 'Success', format: 'boolean' }, { key: 'customerId', label: 'Customer ID' }, { key: 'updated', label: 'Updated Property Slugs' }] },
  searchConversations: { fields: [{ key: 'conversations', label: 'Conversations', labelKey: 'subject', listItems: conversationFields }, { key: 'count', label: 'Count', format: 'number' }, { key: 'truncated', label: 'Truncated', format: 'boolean' }] },
  listThreads: { fields: [{ key: 'threads', label: 'Threads', labelKey: 'type', listItems: threadFields }, { key: 'count', label: 'Count', format: 'number' }, { key: 'truncated', label: 'Truncated', format: 'boolean' }] },
  updateConversation: { fields: [{ key: 'conversationId', label: 'Conversation ID' }, { key: 'applied', label: 'Applied Changes' }] },
  updateConversationTags: { fields: [{ key: 'conversationId', label: 'Conversation ID' }, { key: 'tags', label: 'Tags' }] },
  deleteConversation: { fields: [{ key: 'conversationId', label: 'Conversation ID' }, { key: 'deleted', label: 'Deleted', format: 'boolean' }] },
  listMailboxes: { fields: [{ key: 'mailboxes', label: 'Mailboxes', labelKey: 'name', listItems: mailboxFields }, { key: 'count', label: 'Count', format: 'number' }, { key: 'truncated', label: 'Truncated', format: 'boolean' }] },
  listUsers: { fields: [{ key: 'users', label: 'Users', labelKey: 'email', listItems: userFields }, { key: 'count', label: 'Count', format: 'number' }, { key: 'truncated', label: 'Truncated', format: 'boolean' }] },
  listTags: { fields: [{ key: 'tags', label: 'Tags', labelKey: 'name', listItems: [{ key: 'id', label: 'Tag ID', format: 'number' }, { key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' }, { key: 'color', label: 'Color' }, { key: 'ticketCount', label: 'Conversation Count', format: 'number' }, { key: 'createdAt', label: 'Created At', format: 'datetime' }] }, { key: 'count', label: 'Count', format: 'number' }, { key: 'truncated', label: 'Truncated', format: 'boolean' }] },
  listCustomerProperties: { fields: [{ key: 'properties', label: 'Properties', labelKey: 'name', listItems: [{ key: 'slug', label: 'Slug' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Type', description: 'text, number, url, date or dropdown.' }, { key: 'options', label: 'Options', labelKey: 'label', listItems: [{ key: 'id', label: 'ID' }, { key: 'label', label: 'Label' }] }] }, { key: 'count', label: 'Count', format: 'number' }] },
  conversationWebhook: { fields: [...conversationFields, conversationLinksField] },
  customerWebhook: { fields: customerFields },
};

export const helpScoutSampleConversation = {
  id: 1234567,
  number: 345,
  threads: 1,
  type: 'email',
  folderId: 7654321,
  status: 'active',
  state: 'published',
  subject: 'Question about my invoice',
  preview: 'Hi, I was charged twice this month...',
  mailboxId: 111111,
  assignee: { id: 222222, type: 'user', first: 'Alex', last: 'Agent', email: 'alex@example.com' },
  createdBy: { id: 333333, type: 'customer', first: 'Jane', last: 'Doe', email: 'jane@example.com' },
  createdAt: '2026-11-02T10:00:00Z',
  closedBy: 0,
  userUpdatedAt: '2026-11-02T10:00:00Z',
  customerWaitingSince: { time: '2026-11-02T10:00:00Z', friendly: '1 min ago' },
  source: { type: 'email', via: 'customer' },
  tags: [{ id: 1, color: '#929499', tag: 'billing' }],
  cc: [],
  bcc: [],
  primaryCustomer: { id: 333333, type: 'customer', first: 'Jane', last: 'Doe', email: 'jane@example.com' },
  customFields: [],
  _links: { web: { href: 'https://secure.helpscout.net/conversation/1234567/345/' } },
};
