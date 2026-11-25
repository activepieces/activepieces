import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const refFields: OutputSchemaField[] = [
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'name', label: 'Name' },
];

const userRefFields: OutputSchemaField[] = [
  { key: 'id', label: 'User ID', format: 'number' },
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Name' },
];

const partyRefFields: OutputSchemaField[] = [
  { key: 'id', label: 'Party ID', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'name', label: 'Organisation Name' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
];

const tagFields: OutputSchemaField[] = [
  { key: 'id', label: 'Tag ID', format: 'number' },
  { key: 'name', label: 'Name' },
];

const customFieldValueFields: OutputSchemaField[] = [
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'definition', label: 'Definition', children: refFields },
  { key: 'value', label: 'Value' },
];

const partyFields: OutputSchemaField[] = [
  { key: 'id', label: 'Party ID', format: 'number' },
  { key: 'type', label: 'Type', description: 'person or organisation' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'name', label: 'Organisation Name' },
  { key: 'title', label: 'Title (prefix)' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'about', label: 'About' },
  { key: 'organisation', label: 'Organisation', children: refFields },
  { key: 'owner', label: 'Owner', children: userRefFields },
  { key: 'team', label: 'Team', children: refFields },
  { key: 'emailAddresses', label: 'Email Addresses', labelKey: 'address', listItems: [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'address', label: 'Address', format: 'email' },
  ] },
  { key: 'phoneNumbers', label: 'Phone Numbers', labelKey: 'number', listItems: [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'number', label: 'Number' },
  ] },
  { key: 'addresses', label: 'Addresses', listItems: [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'street', label: 'Street' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'zip', label: 'Zip' },
  ] },
  { key: 'websites', label: 'Websites', labelKey: 'address', listItems: [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'service', label: 'Service' },
    { key: 'address', label: 'Address' },
  ] },
  { key: 'pictureURL', label: 'Picture URL', format: 'url' },
  { key: 'fields', label: 'Custom Fields', listItems: customFieldValueFields },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  { key: 'lastContactedAt', label: 'Last Contacted At', format: 'datetime' },
];

const opportunityFields: OutputSchemaField[] = [
  { key: 'id', label: 'Opportunity ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'party', label: 'Party', children: partyRefFields },
  { key: 'milestone', label: 'Milestone', children: refFields },
  { key: 'owner', label: 'Owner', children: userRefFields },
  { key: 'team', label: 'Team', children: refFields },
  { key: 'value', label: 'Value', children: [
    { key: 'amount', label: 'Amount', format: 'number' },
    { key: 'currency', label: 'Currency' },
  ] },
  { key: 'probability', label: 'Probability (%)', format: 'number' },
  { key: 'expectedCloseOn', label: 'Expected Close Date', format: 'date' },
  { key: 'closedOn', label: 'Closed On', format: 'date' },
  { key: 'lostReason', label: 'Lost Reason' },
  { key: 'durationBasis', label: 'Duration Basis' },
  { key: 'duration', label: 'Duration', format: 'number' },
  { key: 'lastStageChangedAt', label: 'Last Stage Changed At', format: 'datetime' },
  { key: 'lastContactedAt', label: 'Last Contacted At', format: 'datetime' },
  { key: 'fields', label: 'Custom Fields', listItems: customFieldValueFields },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const projectFields: OutputSchemaField[] = [
  { key: 'id', label: 'Project ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'party', label: 'Party', children: partyRefFields },
  { key: 'stage', label: 'Stage', children: refFields },
  { key: 'opportunity', label: 'Opportunity', children: refFields },
  { key: 'owner', label: 'Owner', children: userRefFields },
  { key: 'team', label: 'Team', children: refFields },
  { key: 'startOn', label: 'Start Date', format: 'date' },
  { key: 'expectedCloseOn', label: 'Expected Close Date', format: 'date' },
  { key: 'closedOn', label: 'Closed On', format: 'date' },
  { key: 'lastContactedAt', label: 'Last Contacted At', format: 'datetime' },
  { key: 'fields', label: 'Custom Fields', listItems: customFieldValueFields },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const taskFields: OutputSchemaField[] = [
  { key: 'id', label: 'Task ID', format: 'number' },
  { key: 'description', label: 'Description' },
  { key: 'detail', label: 'Detail' },
  { key: 'status', label: 'Status' },
  { key: 'dueOn', label: 'Due Date', format: 'date' },
  { key: 'dueTime', label: 'Due Time' },
  { key: 'completedAt', label: 'Completed At', format: 'datetime' },
  { key: 'completedBy', label: 'Completed By', children: userRefFields },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'category', label: 'Category', children: refFields },
  { key: 'owner', label: 'Owner', children: userRefFields },
  { key: 'party', label: 'Party', children: partyRefFields },
  { key: 'opportunity', label: 'Opportunity', children: refFields },
  { key: 'kase', label: 'Project', children: refFields },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const entryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Entry ID', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'content', label: 'Content' },
  { key: 'subject', label: 'Subject' },
  { key: 'activityType', label: 'Activity Type', children: refFields },
  { key: 'creator', label: 'Creator', children: userRefFields },
  { key: 'party', label: 'Party', children: partyRefFields },
  { key: 'opportunity', label: 'Opportunity', children: refFields },
  { key: 'kase', label: 'Project', children: refFields },
  { key: 'entryAt', label: 'Entry At', format: 'datetime' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const tagsField: OutputSchemaField = { key: 'tags', label: 'Tags', labelKey: 'name', listItems: tagFields };
const partyEmbedFields: OutputSchemaField[] = [...partyFields, tagsField];
const opportunityEmbedFields: OutputSchemaField[] = [...opportunityFields, tagsField];
const projectEmbedFields: OutputSchemaField[] = [...projectFields, tagsField];

const hasMoreField: OutputSchemaField = {
  key: 'hasMore',
  label: 'Has More',
  format: 'boolean',
  description: 'True when another page exists; call again with Page + 1.',
};

const pageField: OutputSchemaField = { key: 'page', label: 'Page', format: 'number' };

function pageSchema({ key, label, labelKey, items }: { key: string; label: string; labelKey: string; items: OutputSchemaField[] }): OutputSchema {
  return { fields: [{ key, label, labelKey, listItems: items }, pageField, hasMoreField] };
}

export const partyOutputSchema: OutputSchema = { fields: partyFields };
export const partyListOutputSchema: OutputSchema = { fields: partyFields, itemLabel: '{id}: {firstName} {lastName}{name}' };
export const partyEmbedOutputSchema: OutputSchema = { fields: partyEmbedFields };
export const partyPageOutputSchema: OutputSchema = pageSchema({ key: 'parties', label: 'Parties', labelKey: 'id', items: partyEmbedFields });
export const deletePartyOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Party ID', format: 'number' },
    { key: 'accepted', label: 'Accepted', format: 'boolean', description: 'True when Capsule accepted the delete request.' },
    { key: 'completed', label: 'Completed', format: 'boolean', description: 'True when Capsule deleted the party immediately (200/204).' },
    { key: 'async', label: 'Running in Background', format: 'boolean', description: 'True when Capsule queued the delete (202); it finishes shortly after.' },
    { key: 'httpStatus', label: 'HTTP Status', format: 'number' },
  ],
};
export const opportunityOutputSchema: OutputSchema = { fields: opportunityFields };
export const opportunityEmbedOutputSchema: OutputSchema = { fields: opportunityEmbedFields };
export const opportunityListOutputSchema: OutputSchema = { fields: opportunityFields, itemLabel: '{id}: {name}' };
export const opportunityPageOutputSchema: OutputSchema = pageSchema({ key: 'opportunities', label: 'Opportunities', labelKey: 'name', items: opportunityFields });
export const projectOutputSchema: OutputSchema = { fields: projectFields };
export const projectEmbedOutputSchema: OutputSchema = { fields: projectEmbedFields };
export const projectListOutputSchema: OutputSchema = { fields: projectFields, itemLabel: '{id}: {name}' };
export const projectPageOutputSchema: OutputSchema = pageSchema({ key: 'projects', label: 'Projects', labelKey: 'name', items: projectFields });
export const taskOutputSchema: OutputSchema = { fields: taskFields };
export const taskPageOutputSchema: OutputSchema = pageSchema({ key: 'tasks', label: 'Tasks', labelKey: 'description', items: taskFields });
export const entryOutputSchema: OutputSchema = { fields: entryFields };
export const entryPageOutputSchema: OutputSchema = pageSchema({ key: 'entries', label: 'Entries', labelKey: 'id', items: entryFields });
export const usersOutputSchema: OutputSchema = {
  fields: [{ key: 'users', label: 'Users', labelKey: 'name', listItems: [
    { key: 'id', label: 'User ID', format: 'number' },
    { key: 'username', label: 'Username' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'timezone', label: 'Time Zone' },
    { key: 'locale', label: 'Locale' },
    { key: 'currency', label: 'Currency' },
    { key: 'lastLoginAt', label: 'Last Login At', format: 'datetime' },
    { key: 'party', label: 'Party', children: partyRefFields },
  ] }],
};
export const milestonesOutputSchema: OutputSchema = {
  fields: [{ key: 'milestones', label: 'Milestones', labelKey: 'name', listItems: [
    { key: 'id', label: 'Milestone ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'probability', label: 'Probability (%)', format: 'number' },
    { key: 'complete', label: 'Complete', format: 'boolean' },
    { key: 'pipeline', label: 'Pipeline', children: refFields },
  ] }],
};
export const stagesOutputSchema: OutputSchema = {
  fields: [{ key: 'stages', label: 'Stages', labelKey: 'name', listItems: [
    { key: 'id', label: 'Stage ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'board', label: 'Board', children: refFields },
  ] }],
};
