import { OutputSchema } from '@activepieces/pieces-framework';

const recordMutationFields: OutputSchema['fields'] = [
  { key: 'resourceType', label: 'Resource Type' },
  { key: 'resourceName', label: 'Resource Name' },
  { key: 'id', label: 'Record ID' },
  { key: 'record', label: 'Record', description: 'The record as Google Ads returns it after the change; its shape depends on the resource type' },
  { key: 'validateOnly', label: 'Validate Only', format: 'boolean' },
];

const fieldWarningFields: OutputSchema['fields'] = [
  { key: 'field', label: 'Field' },
  { key: 'reason', label: 'Reason' },
  { key: 'description', label: 'Description' },
];

const reasonCountFields: OutputSchema['fields'] = [
  { key: 'reason', label: 'Reason' },
  { key: 'recordCount', label: 'Record Count', format: 'number' },
];

export const recordMutationOutputSchema: OutputSchema = {
  fields: recordMutationFields,
};

export const deleteRecordOutputSchema: OutputSchema = {
  fields: [...recordMutationFields, { key: 'removed', label: 'Removed', format: 'boolean' }],
};

export const searchRecordsOutputSchema: OutputSchema = {
  fields: [
    { key: 'results', label: 'Results', description: 'GAQL rows, nested by resource (for example campaign.id is under campaign)' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextPageToken', label: 'Next Page Token', description: 'Only when fetching one page; empty on the last page' },
    { key: 'truncated', label: 'Truncated', format: 'boolean', description: 'Only when fetching all pages; true when Max Rows was reached' },
  ],
};

export const retrieveReportOutputSchema: OutputSchema = {
  fields: [
    { key: 'query', label: 'GAQL Query' },
    { key: 'rows', label: 'Rows', description: 'One flat object per row, keyed by GAQL field name (for example metrics.clicks)' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'truncated', label: 'Truncated', format: 'boolean' },
  ],
};

export const customerMatchOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status', description: 'PROCESSING unless waiting saw SUCCESS, PARTIAL_SUCCESS or FAILED' },
    { key: 'requestIds', label: 'Request IDs' },
    { key: 'userList', label: 'Audience List Resource Name' },
    { key: 'userListId', label: 'Audience List ID' },
    { key: 'mode', label: 'Mode' },
    { key: 'members', label: 'Members', format: 'number' },
    { key: 'identifiers', label: 'Identifiers', format: 'number' },
    { key: 'requests', label: 'Requests', format: 'number' },
    { key: 'matchRateRange', label: 'Match Rate Range' },
    { key: 'errors', label: 'Errors', labelKey: 'reason', listItems: reasonCountFields },
    { key: 'warnings', label: 'Warnings', labelKey: 'reason', listItems: reasonCountFields },
    {
      key: 'fieldWarnings',
      label: 'Submission Warnings',
      description: 'Row-level warnings Google returned when accepting the upload, with the field path that triggered each one',
      labelKey: 'field',
      listItems: fieldWarningFields,
    },
  ],
};
