import { OutputSchema } from '@activepieces/pieces-framework';

const writeResultFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Record ID' },
  { key: 'module', label: 'Module' },
  { key: 'status', label: 'Status' },
  { key: 'code', label: 'Code' },
  { key: 'message', label: 'Message' },
  { key: 'created_time', label: 'Created Time', format: 'datetime' },
  { key: 'modified_time', label: 'Modified Time', format: 'datetime' },
  { key: 'created_by_id', label: 'Created By ID' },
  { key: 'created_by_name', label: 'Created By' },
  { key: 'modified_by_id', label: 'Modified By ID' },
  { key: 'modified_by_name', label: 'Modified By' },
];

export const recordOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Record ID' },
    { key: 'Created_Time', label: 'Created Time', format: 'datetime' },
    { key: 'Modified_Time', label: 'Modified Time', format: 'datetime' },
    { key: 'record', label: 'All Fields', value: '', dynamicKey: true },
  ],
};

export const recordWriteOutputSchema: OutputSchema = { fields: writeResultFields };

export const upsertOutputSchema: OutputSchema = {
  fields: [
    ...writeResultFields,
    { key: 'action', label: 'Action (insert or update)' },
    { key: 'duplicate_field', label: 'Matched On Field' },
  ],
};

export const deleteOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Record ID' },
    { key: 'module', label: 'Module' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'status', label: 'Status' },
    { key: 'message', label: 'Message' },
  ],
};

export const convertLeadOutputSchema: OutputSchema = {
  fields: [
    { key: 'lead_id', label: 'Lead ID' },
    { key: 'status', label: 'Status' },
    { key: 'message', label: 'Message' },
    { key: 'contact_id', label: 'Contact ID' },
    { key: 'contact_name', label: 'Contact Name' },
    { key: 'account_id', label: 'Account ID' },
    { key: 'account_name', label: 'Account Name' },
    { key: 'deal_id', label: 'Deal ID' },
    { key: 'deal_name', label: 'Deal Name' },
  ],
};

export const childWriteOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'parent_module', label: 'Parent Module' },
    { key: 'parent_id', label: 'Parent Record ID' },
    { key: 'status', label: 'Status' },
    { key: 'message', label: 'Message' },
    { key: 'created_time', label: 'Created Time', format: 'datetime' },
    { key: 'modified_time', label: 'Modified Time', format: 'datetime' },
    { key: 'created_by_name', label: 'Created By' },
  ],
};

export const childChangeOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'status', label: 'Status' },
    { key: 'code', label: 'Code' },
    { key: 'message', label: 'Message' },
    { key: 'created_time', label: 'Created Time', format: 'datetime' },
    { key: 'modified_time', label: 'Modified Time', format: 'datetime' },
    { key: 'modified_by_name', label: 'Modified By' },
  ],
};

export const tagChangeOutputSchema: OutputSchema = {
  fields: [
    { key: 'module', label: 'Module' },
    { key: 'success_count', label: 'Records Updated', format: 'number' },
    { key: 'failed_count', label: 'Records Failed', format: 'number' },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Record ID' },
        { key: 'status', label: 'Status' },
        { key: 'message', label: 'Message' },
        { key: 'tags', label: 'Tags Now On Record' },
      ],
    },
  ],
};
