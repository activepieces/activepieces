import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const emailFields: OutputSchemaField[] = [
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'type', label: 'Type' },
];

const phoneFields: OutputSchemaField[] = [
  { key: 'phone', label: 'Phone' },
  { key: 'phoneFormatted', label: 'Formatted' },
  { key: 'type', label: 'Type' },
];

const urlFields: OutputSchemaField[] = [
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'type', label: 'Type' },
];

const contactFields: OutputSchemaField[] = [
  { key: 'id', label: 'Contact ID', description: 'Close contact ID (cont_...).' },
  { key: 'leadId', label: 'Lead ID' },
  { key: 'name', label: 'Name' },
  { key: 'title', label: 'Title' },
  { key: 'primaryEmail', label: 'Primary Email', format: 'email' },
  { key: 'primaryPhone', label: 'Primary Phone' },
  { key: 'emails', label: 'Emails', labelKey: 'email', listItems: emailFields },
  { key: 'phones', label: 'Phones', labelKey: 'phone', listItems: phoneFields },
  { key: 'urls', label: 'URLs', labelKey: 'url', listItems: urlFields },
  { key: 'custom', label: 'Custom Fields', dynamicKey: true },
  { key: 'dateCreated', label: 'Created', format: 'datetime' },
  { key: 'dateUpdated', label: 'Updated', format: 'datetime' },
];

const leadFields: OutputSchemaField[] = [
  { key: 'id', label: 'Lead ID', description: 'Close lead ID (lead_...).' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'url', label: 'Website', format: 'url' },
  { key: 'statusId', label: 'Status ID' },
  { key: 'statusLabel', label: 'Status' },
  { key: 'contacts', label: 'Contacts', labelKey: 'name', listItems: contactFields },
  { key: 'opportunityIds', label: 'Opportunity IDs' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'custom', label: 'Custom Fields', dynamicKey: true },
  { key: 'createdBy', label: 'Created By (user ID)' },
  { key: 'dateCreated', label: 'Created', format: 'datetime' },
  { key: 'dateUpdated', label: 'Updated', format: 'datetime' },
  { key: 'appUrl', label: 'Open in Close', format: 'url' },
];

const opportunityFields: OutputSchemaField[] = [
  { key: 'id', label: 'Opportunity ID', description: 'Close opportunity ID (oppo_...).' },
  { key: 'leadId', label: 'Lead ID' },
  { key: 'leadName', label: 'Lead Name' },
  { key: 'contactId', label: 'Contact ID' },
  { key: 'userId', label: 'Owner User ID' },
  { key: 'userName', label: 'Owner' },
  { key: 'statusId', label: 'Status ID' },
  { key: 'statusLabel', label: 'Status' },
  { key: 'statusType', label: 'Status Type', description: 'active, won or lost.' },
  { key: 'pipelineId', label: 'Pipeline ID' },
  { key: 'pipelineName', label: 'Pipeline' },
  { key: 'valueCents', label: 'Value (cents)', format: 'number', description: 'Monetary value in cents of the organization currency.' },
  { key: 'valueCurrency', label: 'Currency' },
  { key: 'valueFormatted', label: 'Value (formatted)' },
  { key: 'valuePeriod', label: 'Value Period' },
  { key: 'confidence', label: 'Confidence %', format: 'number' },
  { key: 'note', label: 'Note' },
  { key: 'dateWon', label: 'Close Date', format: 'date', description: 'Won date, or the expected close date while active.' },
  { key: 'dateLost', label: 'Lost Date', format: 'date' },
  { key: 'custom', label: 'Custom Fields', dynamicKey: true },
  { key: 'dateCreated', label: 'Created', format: 'datetime' },
  { key: 'dateUpdated', label: 'Updated', format: 'datetime' },
];

const taskFields: OutputSchemaField[] = [
  { key: 'id', label: 'Task ID' },
  { key: 'type', label: 'Task Type' },
  { key: 'leadId', label: 'Lead ID' },
  { key: 'leadName', label: 'Lead Name' },
  { key: 'contactId', label: 'Contact ID' },
  { key: 'assignedTo', label: 'Assigned To (user ID)' },
  { key: 'assignedToName', label: 'Assigned To' },
  { key: 'text', label: 'Text' },
  { key: 'date', label: 'Due', format: 'datetime' },
  { key: 'isComplete', label: 'Complete', format: 'boolean' },
  { key: 'isDateless', label: 'No Due Date', format: 'boolean' },
  { key: 'dateCreated', label: 'Created', format: 'datetime' },
  { key: 'dateUpdated', label: 'Updated', format: 'datetime' },
];

const activityFields: OutputSchemaField[] = [
  { key: 'id', label: 'Activity ID', description: 'Close activity ID (acti_...).' },
  { key: 'type', label: 'Activity Type', description: 'Note, Call, Email, SMS, Meeting, ...' },
  { key: 'leadId', label: 'Lead ID' },
  { key: 'contactId', label: 'Contact ID' },
  { key: 'userId', label: 'User ID' },
  { key: 'userName', label: 'User' },
  { key: 'direction', label: 'Direction' },
  { key: 'status', label: 'Status' },
  { key: 'subject', label: 'Subject / Title' },
  { key: 'text', label: 'Text' },
  { key: 'durationSeconds', label: 'Duration (s)', format: 'number' },
  { key: 'phone', label: 'Phone' },
  { key: 'activityAt', label: 'Activity At', format: 'datetime' },
  { key: 'dateCreated', label: 'Created', format: 'datetime' },
  { key: 'dateUpdated', label: 'Updated', format: 'datetime' },
];

const userFields: OutputSchemaField[] = [
  { key: 'id', label: 'User ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'name', label: 'Name' },
  { key: 'organizationIds', label: 'Organization IDs' },
  { key: 'dateCreated', label: 'Created', format: 'datetime' },
];

const statusFields: OutputSchemaField[] = [
  { key: 'id', label: 'Status ID' },
  { key: 'label', label: 'Label' },
  { key: 'type', label: 'Type' },
  { key: 'pipelineId', label: 'Pipeline ID' },
];

const pipelineFields: OutputSchemaField[] = [
  { key: 'id', label: 'Pipeline ID' },
  { key: 'name', label: 'Name' },
  { key: 'statuses', label: 'Statuses', labelKey: 'label', listItems: statusFields },
];

const customFieldFields: OutputSchemaField[] = [
  { key: 'id', label: 'Field ID', description: 'Pass as custom.<id> or as a key in Custom Fields.' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'acceptsMultipleValues', label: 'Multiple Values', format: 'boolean' },
  { key: 'choices', label: 'Choices' },
];

function single({ fields }: { fields: OutputSchemaField[] }): OutputSchema {
  return { fields };
}

function found({ fields }: { fields: OutputSchemaField[] }): OutputSchema {
  return { fields: [{ key: 'found', label: 'Found', format: 'boolean' }, ...fields] };
}

function offsetPage({ itemsLabel, labelKey, items }: { itemsLabel: string; labelKey: string; items: OutputSchemaField[] }): OutputSchema {
  return {
    fields: [
      { key: 'items', label: itemsLabel, labelKey, listItems: items },
      { key: 'count', label: 'Returned', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextSkip', label: 'Next Skip', format: 'number', description: 'Pass as skip to get the next page; null when there is none.' },
    ],
  };
}

function cursorPage({ itemsLabel, labelKey, items }: { itemsLabel: string; labelKey: string; items: OutputSchemaField[] }): OutputSchema {
  return {
    fields: [
      { key: 'items', label: itemsLabel, labelKey, listItems: items },
      { key: 'count', label: 'Returned', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextCursor', label: 'Next Cursor', description: 'Pass as cursor within 30 seconds to get the next page; null when there is none.' },
    ],
  };
}

const deleted: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'id', label: 'ID' },
  ],
};

const legacySearch: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'result', label: 'Results', listItems: [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }] },
  ],
};

export const closeOutputSchemas = {
  fields: {
    lead: leadFields,
    contact: contactFields,
    opportunity: opportunityFields,
    task: taskFields,
    activity: activityFields,
    user: userFields,
    status: statusFields,
    pipeline: pipelineFields,
    customField: customFieldFields,
  },
  lead: single({ fields: leadFields }),
  contact: single({ fields: contactFields }),
  opportunity: single({ fields: opportunityFields }),
  task: single({ fields: taskFields }),
  activity: single({ fields: activityFields }),
  user: single({ fields: userFields }),
  pipeline: single({ fields: pipelineFields }),
  foundLead: found({ fields: leadFields }),
  foundContact: found({ fields: contactFields }),
  leads: cursorPage({ itemsLabel: 'Leads', labelKey: 'name', items: leadFields }),
  contacts: cursorPage({ itemsLabel: 'Contacts', labelKey: 'name', items: contactFields }),
  leadsPage: offsetPage({ itemsLabel: 'Leads', labelKey: 'name', items: leadFields }),
  contactsPage: offsetPage({ itemsLabel: 'Contacts', labelKey: 'name', items: contactFields }),
  opportunities: offsetPage({ itemsLabel: 'Opportunities', labelKey: 'leadName', items: opportunityFields }),
  tasks: offsetPage({ itemsLabel: 'Tasks', labelKey: 'text', items: taskFields }),
  activities: offsetPage({ itemsLabel: 'Activities', labelKey: 'type', items: activityFields }),
  users: offsetPage({ itemsLabel: 'Users', labelKey: 'email', items: userFields }),
  pipelines: offsetPage({ itemsLabel: 'Pipelines', labelKey: 'name', items: pipelineFields }),
  statuses: offsetPage({ itemsLabel: 'Statuses', labelKey: 'label', items: statusFields }),
  customFields: offsetPage({ itemsLabel: 'Custom Fields', labelKey: 'name', items: customFieldFields }),
  deleted,
  legacySearch,
  offsetPage,
  cursorPage,
};
