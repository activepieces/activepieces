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


const rawEmailFields: OutputSchemaField[] = [
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'type', label: 'Type' },
  { key: 'is_unsubscribed', label: 'Unsubscribed', format: 'boolean' },
];

const rawPhoneFields: OutputSchemaField[] = [
  { key: 'phone', label: 'Phone' },
  { key: 'phone_formatted', label: 'Formatted' },
  { key: 'country', label: 'Country' },
  { key: 'type', label: 'Type' },
];

const rawUrlFields: OutputSchemaField[] = [
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'type', label: 'Type' },
];

const rawIntegrationLinkFields: OutputSchemaField[] = [
  { key: 'name', label: 'Name' },
  { key: 'url', label: 'URL', format: 'url' },
];

const rawAuditFields: OutputSchemaField[] = [
  { key: 'organization_id', label: 'Organization ID' },
  { key: 'created_by', label: 'Created By (user ID)' },
  { key: 'updated_by', label: 'Updated By (user ID)' },
  { key: 'date_created', label: 'Created', format: 'datetime' },
  { key: 'date_updated', label: 'Updated', format: 'datetime' },
];

const rawContactFields: OutputSchemaField[] = [
  { key: 'id', label: 'Contact ID', description: 'Close contact ID (cont_...).' },
  { key: 'lead_id', label: 'Lead ID' },
  { key: 'name', label: 'Name' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'title', label: 'Title' },
  { key: 'emails', label: 'Emails', labelKey: 'email', listItems: rawEmailFields },
  { key: 'phones', label: 'Phones', labelKey: 'phone', listItems: rawPhoneFields },
  { key: 'urls', label: 'URLs', labelKey: 'url', listItems: rawUrlFields },
  { key: 'custom', label: 'Custom Fields', dynamicKey: true, description: 'Custom field values keyed by field ID (cf_...).' },
  { key: 'integration_links', label: 'Integration Links', labelKey: 'name', listItems: rawIntegrationLinkFields },
  ...rawAuditFields,
];

const rawLeadFields: OutputSchemaField[] = [
  { key: 'id', label: 'Lead ID', description: 'Close lead ID (lead_...).' },
  { key: 'name', label: 'Name' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'description', label: 'Description' },
  { key: 'url', label: 'Website', format: 'url' },
  { key: 'status_id', label: 'Status ID' },
  { key: 'status_label', label: 'Status' },
  { key: 'contacts', label: 'Contacts', labelKey: 'name', listItems: rawContactFields },
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'custom', label: 'Custom Fields', dynamicKey: true, description: 'Custom field values keyed by field name.' },
  { key: 'integration_links', label: 'Integration Links', labelKey: 'name', listItems: rawIntegrationLinkFields },
  { key: 'created_by_name', label: 'Created By' },
  { key: 'updated_by_name', label: 'Updated By' },
  ...rawAuditFields,
];

const rawOpportunityFields: OutputSchemaField[] = [
  { key: 'id', label: 'Opportunity ID', description: 'Close opportunity ID (oppo_...).' },
  { key: 'lead_id', label: 'Lead ID' },
  { key: 'lead_name', label: 'Lead Name' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'user_id', label: 'Owner User ID' },
  { key: 'user_name', label: 'Owner' },
  { key: 'status_id', label: 'Status ID' },
  { key: 'status_label', label: 'Status' },
  { key: 'status_display_name', label: 'Status Display Name' },
  { key: 'status_type', label: 'Status Type', description: 'active, won or lost.' },
  { key: 'pipeline_id', label: 'Pipeline ID' },
  { key: 'pipeline_name', label: 'Pipeline' },
  { key: 'value', label: 'Value (cents)', format: 'number' },
  { key: 'value_currency', label: 'Currency' },
  { key: 'value_formatted', label: 'Value (formatted)' },
  { key: 'value_period', label: 'Value Period' },
  { key: 'expected_value', label: 'Expected Value', format: 'number' },
  { key: 'annualized_value', label: 'Annualized Value', format: 'number' },
  { key: 'annualized_expected_value', label: 'Annualized Expected Value', format: 'number' },
  { key: 'confidence', label: 'Confidence %', format: 'number' },
  { key: 'note', label: 'Note' },
  { key: 'date_won', label: 'Won Date', format: 'date' },
  { key: 'date_lost', label: 'Lost Date', format: 'date' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'custom', label: 'Custom Fields', dynamicKey: true, description: 'Custom field values keyed by field ID (cf_...).' },
  { key: 'integration_links', label: 'Integration Links', labelKey: 'name', listItems: rawIntegrationLinkFields },
  { key: 'created_by_name', label: 'Created By' },
  { key: 'updated_by_name', label: 'Updated By' },
  ...rawAuditFields,
];

const rawSearchLeadFields: OutputSchemaField[] = [
  { key: 'id', label: 'Lead ID' },
  { key: 'name', label: 'Name' },
  { key: 'status_label', label: 'Status' },
  {
    key: 'contacts',
    label: 'Contacts',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Contact ID' },
      { key: 'name', label: 'Name' },
      { key: 'emails', label: 'Emails', labelKey: 'email', listItems: rawEmailFields },
      { key: 'phones', label: 'Phones', labelKey: 'phone', listItems: rawPhoneFields },
    ],
  },
];

const rawSearchContactFields: OutputSchemaField[] = [
  { key: 'id', label: 'Contact ID' },
  { key: 'lead_id', label: 'Lead ID' },
  { key: 'name', label: 'Name' },
  { key: 'title', label: 'Title' },
  { key: 'emails', label: 'Emails', labelKey: 'email', listItems: rawEmailFields },
  { key: 'phones', label: 'Phones', labelKey: 'phone', listItems: rawPhoneFields },
];

function rawSearch({ labelKey, items }: { labelKey: string; items: OutputSchemaField[] }): OutputSchema {
  return {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'result', label: 'Results', labelKey, listItems: items },
    ],
  };
}

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
  raw: {
    lead: single({ fields: rawLeadFields }),
    contact: single({ fields: rawContactFields }),
    opportunity: single({ fields: rawOpportunityFields }),
    leadSearch: rawSearch({ labelKey: 'name', items: rawSearchLeadFields }),
    contactSearch: rawSearch({ labelKey: 'name', items: rawSearchContactFields }),
  },
  offsetPage,
  cursorPage,
};
