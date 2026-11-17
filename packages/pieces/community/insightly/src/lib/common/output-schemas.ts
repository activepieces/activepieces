import { OutputSchema } from '@activepieces/pieces-framework';
import { insightlyUtils } from './client';

const { readString, readNumber, readBoolean } = insightlyUtils;

function contact(record: Record<string, unknown>) {
  return {
    id: readNumber(record['CONTACT_ID']),
    firstName: readString(record['FIRST_NAME']),
    lastName: readString(record['LAST_NAME']),
    email: readString(record['EMAIL_ADDRESS']),
    phone: readString(record['PHONE']),
    title: readString(record['TITLE']),
    organisationId: readNumber(record['ORGANISATION_ID']),
    ownerUserId: readNumber(record['OWNER_USER_ID']),
    createdAt: readString(record['DATE_CREATED_UTC']),
    updatedAt: readString(record['DATE_UPDATED_UTC']),
  };
}

function organisation(record: Record<string, unknown>) {
  return {
    id: readNumber(record['ORGANISATION_ID']),
    name: readString(record['ORGANISATION_NAME']),
    website: readString(record['WEBSITE']),
    phone: readString(record['PHONE']),
    ownerUserId: readNumber(record['OWNER_USER_ID']),
  };
}

function lead(record: Record<string, unknown>) {
  return {
    id: readNumber(record['LEAD_ID']),
    firstName: readString(record['FIRST_NAME']),
    lastName: readString(record['LAST_NAME']),
    email: readString(record['EMAIL']),
    phone: readString(record['PHONE']),
    organisationName: readString(record['ORGANISATION_NAME']),
    statusId: readNumber(record['LEAD_STATUS_ID']),
    sourceId: readNumber(record['LEAD_SOURCE_ID']),
    converted: readBoolean(record['CONVERTED']),
  };
}

function opportunity(record: Record<string, unknown>) {
  return {
    id: readNumber(record['OPPORTUNITY_ID']),
    name: readString(record['OPPORTUNITY_NAME']),
    state: readString(record['OPPORTUNITY_STATE']),
    value: readNumber(record['BID_AMOUNT']),
    currency: readString(record['BID_CURRENCY']),
    probability: readNumber(record['PROBABILITY']),
    closeDate: readString(record['FORECAST_CLOSE_DATE']),
    pipelineId: readNumber(record['PIPELINE_ID']),
    stageId: readNumber(record['STAGE_ID']),
    organisationId: readNumber(record['ORGANISATION_ID']),
  };
}

function project(record: Record<string, unknown>) {
  return {
    id: readNumber(record['PROJECT_ID']),
    name: readString(record['PROJECT_NAME']),
    status: readString(record['STATUS']),
    pipelineId: readNumber(record['PIPELINE_ID']),
    stageId: readNumber(record['STAGE_ID']),
    opportunityId: readNumber(record['OPPORTUNITY_ID']),
  };
}

function task(record: Record<string, unknown>) {
  return {
    id: readNumber(record['TASK_ID']),
    title: readString(record['TITLE']),
    status: readString(record['STATUS']),
    completed: readBoolean(record['COMPLETED']),
    dueDate: readString(record['DUE_DATE']),
    ownerUserId: readNumber(record['OWNER_USER_ID']),
    responsibleUserId: readNumber(record['RESPONSIBLE_USER_ID']),
  };
}

function event(record: Record<string, unknown>) {
  return {
    id: readNumber(record['EVENT_ID']),
    title: readString(record['TITLE']),
    start: readString(record['START_DATE_UTC']),
    end: readString(record['END_DATE_UTC']),
    allDay: readBoolean(record['ALL_DAY']),
    location: readString(record['LOCATION']),
  };
}

function listSchema({ key, label, itemFields, labelKey }: { key: string; label: string; itemFields: OutputSchema['fields']; labelKey: string }): OutputSchema {
  return {
    fields: [
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'hasMore', label: 'More Results Available', format: 'boolean' },
      { key, label, labelKey, listItems: itemFields },
    ],
  };
}

const contactFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Contact ID' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'title', label: 'Job Title' },
  { key: 'organisationId', label: 'Organization ID' },
  { key: 'ownerUserId', label: 'Owner User ID' },
  { key: 'createdAt', label: 'Created At', description: 'Insightly UTC timestamp, text in YYYY-MM-DD HH:MM:SS format' },
  { key: 'updatedAt', label: 'Updated At', description: 'Insightly UTC timestamp, text in YYYY-MM-DD HH:MM:SS format' },
];

const organisationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Organization ID' },
  { key: 'name', label: 'Name' },
  { key: 'website', label: 'Website', format: 'url' },
  { key: 'phone', label: 'Phone' },
  { key: 'ownerUserId', label: 'Owner User ID' },
];

const leadFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Lead ID' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'organisationName', label: 'Organization Name' },
  { key: 'statusId', label: 'Lead Status ID' },
  { key: 'sourceId', label: 'Lead Source ID' },
  { key: 'converted', label: 'Converted', format: 'boolean' },
];

const opportunityFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Opportunity ID' },
  { key: 'name', label: 'Name' },
  { key: 'state', label: 'State' },
  { key: 'value', label: 'Value', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'probability', label: 'Probability', format: 'number' },
  { key: 'closeDate', label: 'Forecast Close Date', description: 'Text in YYYY-MM-DD HH:MM:SS format' },
  { key: 'pipelineId', label: 'Pipeline ID' },
  { key: 'stageId', label: 'Stage ID' },
  { key: 'organisationId', label: 'Organization ID' },
];

const projectFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Project ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'pipelineId', label: 'Pipeline ID' },
  { key: 'stageId', label: 'Stage ID' },
  { key: 'opportunityId', label: 'Opportunity ID' },
];

const taskFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Task ID' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'completed', label: 'Completed', format: 'boolean' },
  { key: 'dueDate', label: 'Due Date', description: 'Insightly UTC timestamp, text in YYYY-MM-DD HH:MM:SS format' },
  { key: 'ownerUserId', label: 'Owner User ID' },
  { key: 'responsibleUserId', label: 'Responsible User ID' },
];

const eventFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Event ID' },
  { key: 'title', label: 'Title' },
  { key: 'start', label: 'Start', description: 'Insightly UTC timestamp, text in YYYY-MM-DD HH:MM:SS format' },
  { key: 'end', label: 'End', description: 'Insightly UTC timestamp, text in YYYY-MM-DD HH:MM:SS format' },
  { key: 'allDay', label: 'All Day', format: 'boolean' },
  { key: 'location', label: 'Location' },
];

const genericRecordFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Record ID' },
  { key: 'objectType', label: 'Object Type' },
  { key: 'FIRST_NAME', label: 'First Name' },
  { key: 'LAST_NAME', label: 'Last Name' },
  { key: 'EMAIL_ADDRESS', label: 'Email (Contact)', format: 'email' },
  { key: 'EMAIL', label: 'Email (Lead)', format: 'email' },
  { key: 'ORGANISATION_NAME', label: 'Organization Name' },
  { key: 'OPPORTUNITY_NAME', label: 'Opportunity Name' },
  { key: 'PROJECT_NAME', label: 'Project Name' },
  { key: 'TITLE', label: 'Title' },
  { key: 'OWNER_USER_ID', label: 'Owner User ID' },
  { key: 'DATE_CREATED_UTC', label: 'Created At', description: 'Insightly UTC timestamp, text in YYYY-MM-DD HH:MM:SS format' },
  { key: 'DATE_UPDATED_UTC', label: 'Updated At', description: 'Insightly UTC timestamp, text in YYYY-MM-DD HH:MM:SS format' },
  { key: 'CUSTOMFIELDS', label: 'Custom Fields', labelKey: 'FIELD_NAME', listItems: [{ key: 'FIELD_NAME', label: 'Field Name' }, { key: 'FIELD_VALUE', label: 'Value' }] },
];

const updatedFieldsSchema = (idLabel: string): OutputSchema => ({
  fields: [
    { key: 'id', label: idLabel },
    { key: 'updatedFields', label: 'Updated Fields' },
  ],
});

export const insightlyMappers = { contact, organisation, lead, opportunity, project, task, event };

export const outputSchemas: Record<string, OutputSchema> = {
  genericRecord: { fields: genericRecordFields },
  createdRecord: { fields: [{ key: 'success', label: 'Success', format: 'boolean' }, { key: 'recordId', label: 'Record ID' }, ...genericRecordFields] },
  updatedRecord: { fields: [{ key: 'success', label: 'Success', format: 'boolean' }, ...genericRecordFields] },
  genericRecordList: { itemLabel: '{id}', fields: [{ key: 'records', label: 'Records', value: '', labelKey: 'id', listItems: genericRecordFields }] },
  deletedRecord: {
    fields: [
      { key: 'success', label: 'Deleted', format: 'boolean' },
      { key: 'id', label: 'Record ID' },
      { key: 'objectType', label: 'Object Type' },
      { key: 'message', label: 'Message' },
    ],
  },
  aiDeletedRecord: {
    fields: [
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'id', label: 'Record ID' },
      { key: 'objectType', label: 'Object Type' },
    ],
  },
  note: {
    fields: [
      { key: 'noteId', label: 'Note ID' },
      { key: 'title', label: 'Title' },
      { key: 'linkedObject', label: 'Linked Object Type' },
      { key: 'linkedId', label: 'Linked Record ID' },
    ],
  },
  task: { fields: taskFields },
  stageChange: {
    fields: [
      { key: 'opportunityId', label: 'Opportunity ID' },
      { key: 'pipelineId', label: 'Pipeline ID' },
      { key: 'stageId', label: 'Stage ID' },
    ],
  },
  contact: { fields: contactFields },
  contactList: listSchema({ key: 'contacts', label: 'Contacts', itemFields: contactFields, labelKey: 'email' }),
  organisation: { fields: organisationFields },
  organisationList: listSchema({ key: 'organisations', label: 'Organizations', itemFields: organisationFields, labelKey: 'name' }),
  lead: { fields: leadFields },
  leadList: listSchema({ key: 'leads', label: 'Leads', itemFields: leadFields, labelKey: 'email' }),
  opportunity: { fields: opportunityFields },
  opportunityList: listSchema({ key: 'opportunities', label: 'Opportunities', itemFields: opportunityFields, labelKey: 'name' }),
  project: { fields: projectFields },
  projectList: listSchema({ key: 'projects', label: 'Projects', itemFields: projectFields, labelKey: 'name' }),
  taskList: listSchema({ key: 'tasks', label: 'Tasks', itemFields: taskFields, labelKey: 'title' }),
  event: { fields: eventFields },
  updatedContact: updatedFieldsSchema('Contact ID'),
  updatedOpportunity: updatedFieldsSchema('Opportunity ID'),
  aiRecord: {
    fields: [
      { key: 'id', label: 'Record ID' },
      { key: 'objectType', label: 'Object Type' },
      { key: 'fields', label: 'Fields' },
    ],
  },
  pipelines: {
    fields: [
      {
        key: 'pipelines',
        label: 'Pipelines',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Pipeline ID' },
          { key: 'name', label: 'Name' },
          { key: 'stages', label: 'Stages', labelKey: 'name', listItems: [{ key: 'id', label: 'Stage ID' }, { key: 'name', label: 'Name' }, { key: 'order', label: 'Order', format: 'number' }] },
        ],
      },
    ],
  },
  stageLookup: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'pipelineId', label: 'Pipeline ID' },
      { key: 'stageId', label: 'Stage ID' },
    ],
  },
  user: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'userId', label: 'User ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', format: 'email' },
    ],
  },
  categories: {
    fields: [{ key: 'categories', label: 'Categories', labelKey: 'name', listItems: [{ key: 'id', label: 'Category ID' }, { key: 'name', label: 'Name' }, { key: 'active', label: 'Active', format: 'boolean' }] }],
  },
  customFields: {
    fields: [
      {
        key: 'fields',
        label: 'Custom Fields',
        labelKey: 'label',
        listItems: [
          { key: 'name', label: 'Field Name' },
          { key: 'label', label: 'Label' },
          { key: 'type', label: 'Type' },
          { key: 'options', label: 'Options' },
        ],
      },
    ],
  },
  customFieldSet: {
    fields: [
      { key: 'id', label: 'Record ID' },
      { key: 'fieldName', label: 'Field Name' },
      { key: 'value', label: 'Value' },
    ],
  },
  leadSourcesStatuses: {
    fields: [
      { key: 'sources', label: 'Lead Sources', labelKey: 'name', listItems: [{ key: 'id', label: 'Source ID' }, { key: 'name', label: 'Name' }] },
      { key: 'statuses', label: 'Lead Statuses', labelKey: 'name', listItems: [{ key: 'id', label: 'Status ID' }, { key: 'name', label: 'Name' }] },
    ],
  },
  webhookRecord: {
    fields: [
      { key: 'recordId', label: 'Record ID' },
      ...genericRecordFields
        .filter((field) => field.key !== 'id')
        .map((field) => (field.key.startsWith('DATE_') ? { ...field, description: 'UTC timestamp as sent by the Insightly webhook, e.g. 2026-11-17T13:04:34.96' } : field)),
    ],
  },
  deletedTrigger: {
    fields: [
      { key: 'recordId', label: 'Record ID' },
      { key: 'recordName', label: 'Record Name' },
      { key: 'objectType', label: 'Object Type' },
      { key: 'deletedAt', label: 'Detected At', format: 'datetime' },
      { key: 'lastSeenAt', label: 'Last Seen At', format: 'datetime' },
    ],
  },
};
