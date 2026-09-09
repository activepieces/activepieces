import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const todoFields: OutputSchemaField[] = [
  { key: '_id', label: 'To-Do ID' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'dueDate', label: 'Due Date', format: 'date' },
  {
    key: 'isPersonal',
    label: 'Is Personal',
    format: 'boolean',
    description: 'True when the to-do belongs to a person rather than a team.',
  },
  { key: 'completed', label: 'Completed', format: 'boolean' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'teamId', label: 'Team ID' },
  { key: 'teamName', label: 'Team Name' },
  { key: 'userId', label: 'Owner User ID' },
  { key: 'companyId', label: 'Company ID' },
  { key: 'createdDate', label: 'Created Date', format: 'datetime' },
];

const issueFields: OutputSchemaField[] = [
  { key: '_id', label: 'Issue ID' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description', format: 'html' },
  {
    key: 'intervalCode',
    label: 'Term',
    description: 'SHORT_TERM for the weekly list, LONG_TERM for the parking lot.',
  },
  {
    key: 'priority',
    label: 'Priority',
    format: 'number',
    description: '0 to 5, where 0 is unrated and 5 is highest.',
  },
  { key: 'completed', label: 'Completed', format: 'boolean' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'teamId', label: 'Team ID' },
  { key: 'userId', label: 'Owner User ID' },
  { key: 'companyId', label: 'Company ID' },
  { key: 'createdDate', label: 'Created Date', format: 'datetime' },
];

const milestoneFields: OutputSchemaField[] = [
  { key: '_id', label: 'Milestone ID' },
  { key: 'rockId', label: 'Rock ID' },
  { key: 'teamId', label: 'Team ID' },
  { key: 'ownedByUserId', label: 'Owner User ID' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'dueDate', label: 'Due Date', format: 'datetime' },
  { key: 'isDone', label: 'Is Done', format: 'boolean' },
  { key: 'createdDate', label: 'Created Date', format: 'datetime' },
];

const rockQueryFields: OutputSchemaField[] = [
  {
    key: '_id',
    label: 'Rock ID',
    description: 'Every Ninety record uses _id. Only users use id.',
  },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'teamId', label: 'Team ID' },
  { key: 'userId', label: 'Owner User ID' },
  { key: 'companyId', label: 'Company ID' },
  {
    key: 'statusCode',
    label: 'Status',
    description: 'ON_TRACK, OFF_TRACK, DONE, CANCELED or DRAFT.',
  },
  {
    key: 'levelCode',
    label: 'Level',
    description: 'USER, DEPARTMENT, COMPANY or COMPANY_AND_DEPARTMENT.',
  },
  { key: 'quarter', label: 'Quarter' },
  { key: 'dueDate', label: 'Due Date', format: 'datetime' },
  { key: 'futureScope', label: 'Planning Horizon' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'completed', label: 'Completed', format: 'boolean' },
  { key: 'createdDate', label: 'Created Date', format: 'datetime' },
];

const rockFields: OutputSchemaField[] = [
  ...rockQueryFields,
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const measurableFields: OutputSchemaField[] = [
  { key: '_id', label: 'Measurable ID' },
  { key: 'title', label: 'Title' },
  {
    key: 'unit',
    label: 'Unit',
    description: 'number, percentage, yesno, time, dollar, euro or pound.',
  },
  { key: 'currency', label: 'Currency' },
  {
    key: 'periodInterval',
    label: 'Cadence',
    description: 'weekly, monthly, quarterly or annual.',
  },
  { key: 'userFullName', label: 'Owner Name' },
  { key: 'type', label: 'Type', description: 'active or archived.' },
  { key: 'isSmart', label: 'Is Smart', format: 'boolean' },
];

const teamFields: OutputSchemaField[] = [
  { key: '_id', label: 'Team ID' },
  { key: 'name', label: 'Name' },
];

const countFields: OutputSchemaField[] = [
  {
    key: 'count',
    label: 'Count',
    format: 'number',
    description: 'How many records this page returned.',
  },
  {
    key: 'totalCount',
    label: 'Total Count',
    format: 'number',
    description: 'How many records match in total, across every page.',
  },
];

export const todoOutputSchema: OutputSchema = { fields: todoFields };

export const todoListOutputSchema: OutputSchema = {
  fields: [
    { key: 'todos', label: 'To-Dos', labelKey: 'title', listItems: todoFields },
    {
      key: 'count',
      label: 'Count',
      format: 'number',
      description: 'How many to-dos this page returned.',
    },
    {
      key: 'totalCount',
      label: 'Total Count',
      format: 'number',
      description:
        'The Ninety to-do search returns a plain list with no overall total, so this matches Count. Page through to find out whether more exist.',
    },
  ],
};

export const issueOutputSchema: OutputSchema = { fields: issueFields };

export const issueListOutputSchema: OutputSchema = {
  fields: [
    { key: 'issues', label: 'Issues', labelKey: 'title', listItems: issueFields },
    ...countFields,
  ],
};

export const rockOutputSchema: OutputSchema = { fields: rockFields };

export const rockListOutputSchema: OutputSchema = {
  fields: [
    { key: 'rocks', label: 'Rocks', labelKey: 'title', listItems: rockQueryFields },
    ...countFields,
  ],
};

export const milestoneOutputSchema: OutputSchema = { fields: milestoneFields };

export const measurableListOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'measurables',
      label: 'Measurables',
      labelKey: 'title',
      listItems: measurableFields,
    },
    ...countFields,
  ],
};

export const teamListOutputSchema: OutputSchema = {
  fields: [
    { key: 'teams', label: 'Teams', labelKey: 'name', listItems: teamFields },
    {
      key: 'count',
      label: 'Count',
      format: 'number',
      description: 'How many teams this connection can see.',
    },
  ],
};

export const measurableScoreOutputSchema: OutputSchema = {
  fields: [
    { key: 'measurableId', label: 'Measurable ID' },
    { key: 'value', label: 'Value', format: 'number' },
    {
      key: 'periodStartDate',
      label: 'Period Start Date',
      format: 'datetime',
      description: 'The period this score was written to. Ninety keys the score on it.',
    },
    {
      key: 'response',
      label: 'Ninety Response',
      description:
        'Whatever Ninety returned for the write. The endpoint is not documented to return a body, so this is often empty.',
    },
  ],
};

export const todoTriggerOutputSchema: OutputSchema = { fields: todoFields };

export const issueTriggerOutputSchema: OutputSchema = { fields: issueFields };

export const rockTriggerOutputSchema: OutputSchema = { fields: rockQueryFields };
