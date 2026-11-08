import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const recordWithIdFields: OutputSchemaField[] = [
  { key: 'id', label: 'Record ID' },
  { key: 'objectSystemName', label: 'Object Type' },
  { key: 'record', label: 'Record', description: 'Record fields keyed by system name. createdon/modifiedon are account-local time with no offset (e.g. 2026-11-01T15:20:57.957).' },
];

const queryResultFields: OutputSchemaField[] = [
  { key: 'records', label: 'Records', description: 'Fields of each record, keyed by system name. createdon/modifiedon are account-local time with no offset (e.g. 2026-11-01T15:20:57.957).' },
  { key: 'recordCount', label: 'Record Count', format: 'number' },
  { key: 'pageNumber', label: 'Page Number', format: 'number' },
  { key: 'isLastPage', label: 'Is Last Page', format: 'boolean' },
  { key: 'primaryKey', label: 'Primary Key Field' },
  { key: 'primaryField', label: 'Primary Display Field' },
];

export const fireberryOutputSchemas: Record<string, OutputSchema> = {
  createRecord: { fields: recordWithIdFields },
  updateRecord: { fields: recordWithIdFields },
  deleteRecords: {
    fields: [
      { key: 'deletedIds', label: 'Deleted Record IDs' },
      { key: 'deletedCount', label: 'Deleted Count', format: 'number' },
    ],
  },
  findRecords: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'query', label: 'Query Sent' },
      {
        key: 'results',
        label: 'Results',
        children: [
          { key: 'objectName', label: 'Object Name' },
          { key: 'systemName', label: 'Object System Name' },
          { key: 'objectType', label: 'Object Type Number', format: 'number' },
          { key: 'pageNumber', label: 'Page Number', format: 'number' },
          { key: 'sortBy', label: 'Sort By' },
          { key: 'sortDescending', label: 'Sort Descending', format: 'boolean' },
          { key: 'isLastPage', label: 'Is Last Page', format: 'boolean' },
          { key: 'primaryKey', label: 'Primary Key Field' },
          { key: 'primaryField', label: 'Primary Display Field' },
          { key: 'columns', label: 'Columns' },
          { key: 'records', label: 'Records', description: 'Fields of each record, keyed by system name. createdon/modifiedon are account-local time with no offset (e.g. 2026-11-01T15:20:57.957).' },
          { key: 'recordCount', label: 'Record Count', format: 'number' },
        ],
      },
    ],
  },
  listObjectTypes: {
    fields: [
      {
        key: 'objectTypes',
        label: 'Object Types',
        labelKey: 'name',
        listItems: [
          { key: 'name', label: 'Name' },
          { key: 'systemName', label: 'System Name' },
          { key: 'objectType', label: 'Object Type Number', format: 'number' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  listObjectFields: {
    fields: [
      { key: 'objectSystemName', label: 'Object Type' },
      {
        key: 'fields',
        label: 'Fields',
        labelKey: 'label',
        listItems: [
          { key: 'fieldName', label: 'Field Name' },
          { key: 'label', label: 'Label' },
          { key: 'type', label: 'Type' },
          { key: 'systemFieldTypeId', label: 'Field Type ID' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  listPicklistValues: {
    fields: [
      { key: 'objectSystemName', label: 'Object Type' },
      { key: 'fieldName', label: 'Field Name' },
      {
        key: 'values',
        label: 'Values',
        labelKey: 'name',
        listItems: [
          { key: 'name', label: 'Name' },
          { key: 'value', label: 'Value' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  searchRecords: { fields: queryResultFields },
  getRecord: { fields: recordWithIdFields },
  deleteRecord: {
    fields: [
      { key: 'id', label: 'Deleted Record ID' },
      { key: 'objectSystemName', label: 'Object Type' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
    ],
  },
};
