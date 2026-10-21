import { OutputSchema } from '@activepieces/pieces-framework';

type Field = OutputSchema['fields'][number];

const userRefFields: Field[] = [
  { key: 'id', label: 'User ID' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'email', label: 'Email', format: 'email' },
];

const groupRefField: Field = {
  key: 'groups',
  label: 'Groups',
  labelKey: 'name',
  listItems: [
    { key: 'id', label: 'Group ID' },
    { key: 'name', label: 'Group Name' },
  ],
};

const contactListFields: Field[] = [
  { key: 'emails', label: 'Emails' },
  { key: 'phones', label: 'Phones' },
  { key: 'urls', label: 'URLs' },
  { key: 'addresses', label: 'Addresses' },
];

const customFieldValuesField: Field = {
  key: 'customFieldValues',
  label: 'Custom Field Values',
  description: 'Keyed by group ID, then by custom field name.',
  dynamicKey: true,
};

const personFields: Field[] = [
  { key: 'id', label: 'Person ID' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'description', label: 'Description' },
  { key: 'birthday', label: 'Birthday', format: 'date' },
  { key: 'gender', label: 'Gender' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'createdBy', label: 'Created By', children: userRefFields },
  groupRefField,
  {
    key: 'companies',
    label: 'Companies',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Company ID' },
      { key: 'name', label: 'Company Name' },
    ],
  },
  ...contactListFields,
  customFieldValuesField,
  {
    key: 'interactionMetadata',
    label: 'Interaction Metadata',
    children: [
      {
        key: 'user',
        label: 'Your Interactions',
        children: [
          { key: 'approximateCount', label: 'Approximate Count', format: 'number' },
          { key: 'lastInteractedAt', label: 'Last Interacted At', format: 'datetime' },
        ],
      },
      {
        key: 'workspace',
        label: 'Workspace Interactions',
        children: [
          { key: 'approximateCount', label: 'Approximate Count', format: 'number' },
          { key: 'lastInteractedAt', label: 'Last Interacted At', format: 'datetime' },
        ],
      },
    ],
  },
];

const companyFields: Field[] = [
  { key: 'id', label: 'Company ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'industry', label: 'Industry' },
  { key: 'employeeRange', label: 'Employee Range' },
  { key: 'foundationYear', label: 'Foundation Year' },
  { key: 'fundingRaised', label: 'Funding Raised', format: 'number' },
  { key: 'lastFundingDate', label: 'Last Funding Date', format: 'date' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'createdBy', label: 'Created By', children: userRefFields },
  groupRefField,
  ...contactListFields,
  customFieldValuesField,
];

const entityRefField: Field = {
  key: 'entity',
  label: 'Linked Record',
  children: [
    { key: 'id', label: 'Record ID' },
    { key: 'entityType', label: 'Record Type' },
    { key: 'fullName', label: 'Record Name' },
  ],
};

const noteFields: Field[] = [
  { key: 'id', label: 'Note ID' },
  { key: 'content', label: 'Content' },
  { key: 'visibility', label: 'Visibility' },
  entityRefField,
  {
    key: 'author',
    label: 'Author',
    children: [
      { key: 'type', label: 'Author Type' },
      { key: 'id', label: 'Author ID' },
      { key: 'fullName', label: 'Author Name' },
      { key: 'email', label: 'Author Email', format: 'email' },
    ],
  },
  { key: 'parentNote', label: 'Parent Note', children: [{ key: 'id', label: 'Parent Note ID' }] },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
];

const taskFields: Field[] = [
  { key: 'id', label: 'Task ID' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'dueAt', label: 'Due Date', format: 'date' },
  { key: 'dueTime', label: 'Due Time' },
  { key: 'completedAt', label: 'Completed At', format: 'datetime' },
  { key: 'recurrenceFrequency', label: 'Recurrence' },
  { key: 'isPublic', label: 'Public', format: 'boolean' },
  entityRefField,
  { key: 'assignedUsers', label: 'Assigned Users', labelKey: 'fullName', listItems: userRefFields },
  { key: 'createdBy', label: 'Created By', children: userRefFields },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const groupFields: Field[] = [
  { key: 'id', label: 'Group ID' },
  { key: 'name', label: 'Name' },
  { key: 'visibility', label: 'Visibility' },
];

const customFieldFields: Field[] = [
  { key: 'name', label: 'Field Name' },
  { key: 'type', label: 'Field Type' },
  {
    key: 'options',
    label: 'Options',
    labelKey: 'label',
    listItems: [
      { key: 'id', label: 'Option ID' },
      { key: 'label', label: 'Label' },
      { key: 'color', label: 'Color' },
    ],
  },
];

const objectFields: Field[] = [
  { key: 'id', label: 'Object ID' },
  { key: 'name', label: 'Name' },
  {
    key: 'companies',
    label: 'Companies',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Company ID' },
      { key: 'name', label: 'Company Name' },
    ],
  },
  {
    key: 'people',
    label: 'People',
    labelKey: 'fullName',
    listItems: [
      { key: 'id', label: 'Person ID' },
      { key: 'fullName', label: 'Full Name' },
    ],
  },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'createdBy', label: 'Created By', children: userRefFields },
  customFieldValuesField,
];

const interactionFields: Field[] = [
  { key: 'id', label: 'Interaction ID' },
  { key: 'title', label: 'Title' },
  { key: 'content', label: 'Content' },
  { key: 'type', label: 'Type' },
  { key: 'dateTime', label: 'Date and Time', format: 'datetime' },
  {
    key: 'entity',
    label: 'Linked Record',
    children: [
      { key: 'id', label: 'Record ID' },
      { key: 'entityType', label: 'Record Type' },
      { key: 'fullName', label: 'Record Name' },
    ],
  },
];

function listSchema({ label, itemFields, labelKey }: { label: string; itemFields: Field[]; labelKey: string }): OutputSchema {
  return {
    fields: [
      { key: 'items', label, labelKey, listItems: itemFields },
      { key: 'count', label: 'Items On This Page', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextCursor', label: 'Next Cursor', description: 'Pass as Cursor to get the next page. Empty on the last page.' },
    ],
  };
}

function deletedSchema({ label }: { label: string }): OutputSchema {
  return {
    fields: [
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'id', label },
    ],
  };
}

const webhookEventFields: Field[] = [
  { key: 'id', label: 'Event ID' },
  { key: 'type', label: 'Event Type' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  {
    key: 'data',
    label: 'Data',
    children: [
      { key: 'id', label: 'Record ID' },
      { key: 'url', label: 'Record API URL', format: 'url' },
      {
        key: 'changes',
        label: 'Changes',
        listItems: [
          { key: 'path', label: 'Path' },
          { key: 'type', label: 'Change Type' },
          { key: 'value', label: 'Value' },
        ],
      },
    ],
  },
];

export const folkOutputSchemas = {
  person: { fields: personFields },
  company: { fields: companyFields },
  note: { fields: noteFields },
  task: { fields: taskFields },
  object: { fields: objectFields },
  interaction: { fields: interactionFields },
  user: { fields: userRefFields },
  people: listSchema({ label: 'People', itemFields: personFields, labelKey: 'fullName' }),
  companies: listSchema({ label: 'Companies', itemFields: companyFields, labelKey: 'name' }),
  notes: listSchema({ label: 'Notes', itemFields: noteFields, labelKey: 'content' }),
  tasks: listSchema({ label: 'Tasks', itemFields: taskFields, labelKey: 'title' }),
  groups: listSchema({ label: 'Groups', itemFields: groupFields, labelKey: 'name' }),
  customFields: listSchema({ label: 'Custom Fields', itemFields: customFieldFields, labelKey: 'name' }),
  objects: listSchema({ label: 'Objects', itemFields: objectFields, labelKey: 'name' }),
  users: listSchema({ label: 'Users', itemFields: userRefFields, labelKey: 'fullName' }),
  deletedPerson: deletedSchema({ label: 'Person ID' }),
  deletedCompany: deletedSchema({ label: 'Company ID' }),
  deletedNote: deletedSchema({ label: 'Note ID' }),
  deletedTask: deletedSchema({ label: 'Task ID' }),
  deletedObject: deletedSchema({ label: 'Object ID' }),
  legacyCompanyWrite: {
    fields: [
      { key: 'company', label: 'Company', children: companyFields },
      { key: 'success', label: 'Success', format: 'boolean' },
    ],
  },
  legacyCompanyGet: { fields: [{ key: 'company', label: 'Company', children: companyFields }] },
  legacyPersonCreate: { fields: personFields },
  legacyPersonWrite: {
    fields: [
      { key: 'data', label: 'Person', children: personFields },
      { key: 'success', label: 'Success', format: 'boolean' },
    ],
  },
  legacyFindCompany: {
    fields: [
      { key: 'companies', label: 'Companies', labelKey: 'name', listItems: companyFields },
      { key: 'count', label: 'Items On This Page', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextCursor', label: 'Next Cursor' },
    ],
  },
  legacyListPeople: {
    fields: [
      {
        key: 'data',
        label: 'Data',
        children: [{ key: 'items', label: 'People', labelKey: 'fullName', listItems: personFields }],
      },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextCursor', label: 'Next Cursor' },
      { key: 'success', label: 'Success', format: 'boolean' },
    ],
  },
  webhookEvent: { fields: webhookEventFields },
  customApiCall: {
    fields: [
      { key: 'status', label: 'Status Code', format: 'number' },
      { key: 'headers', label: 'Headers', dynamicKey: true },
      { key: 'body', label: 'Body' },
    ],
  },
} satisfies Record<string, OutputSchema>;
