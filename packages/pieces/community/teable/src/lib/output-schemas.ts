import { OutputSchema } from '@activepieces/pieces-framework';

const recordFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Record ID' },
  { key: 'name', label: 'Record Name' },
  { key: 'fields', label: 'Fields', dynamicKey: true },
  { key: 'autoNumber', label: 'Auto Number', format: 'number' },
  { key: 'createdTime', label: 'Created Time', format: 'datetime' },
  { key: 'lastModifiedTime', label: 'Last Modified Time', format: 'datetime' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'lastModifiedBy', label: 'Last Modified By' },
];

const fieldFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Field ID' },
  { key: 'name', label: 'Field Name' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'isPrimary', label: 'Is Primary', format: 'boolean' },
  { key: 'isComputed', label: 'Is Computed', format: 'boolean' },
  { key: 'notNull', label: 'Required', format: 'boolean' },
  { key: 'unique', label: 'Unique', format: 'boolean' },
  { key: 'dbFieldName', label: 'Database Field Name' },
];

const recordCoreFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Record ID' },
  { key: 'fields', label: 'Fields', dynamicKey: true },
];

const record: OutputSchema = {
  fields: recordFields,
};

const recordCore: OutputSchema = {
  fields: recordCoreFields,
};

const createRecord: OutputSchema = {
  fields: [
    {
      key: 'records',
      label: 'Created Records',
      labelKey: 'id',
      listItems: recordCoreFields,
    },
  ],
};

const listRecords: OutputSchema = {
  fields: [
    {
      key: 'records',
      label: 'Records',
      labelKey: 'name',
      listItems: recordFields,
    },
    { key: 'recordCount', label: 'Record Count', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
  ],
};

const updatedRecords: OutputSchema = {
  itemLabel: '{id}',
  fields: [
    {
      key: 'records',
      label: 'Updated Records',
      value: '',
      labelKey: 'id',
      listItems: recordCoreFields,
    },
  ],
};

const deleteRecord: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'recordId', label: 'Record ID' },
  ],
};

const deleteRecords: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'deletedCount', label: 'Deleted Count', format: 'number' },
    { key: 'recordIds', label: 'Record IDs' },
  ],
};

const addComment: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'recordId', label: 'Record ID' },
    { key: 'comment', label: 'Comment' },
  ],
};

const listBases: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'bases',
      label: 'Bases',
      value: '',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Base ID' },
        { key: 'name', label: 'Base Name' },
        { key: 'spaceId', label: 'Space ID' },
        { key: 'icon', label: 'Icon' },
        { key: 'role', label: 'Role' },
      ],
    },
  ],
};

const listTables: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'tables',
      label: 'Tables',
      value: '',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Table ID' },
        { key: 'name', label: 'Table Name' },
        { key: 'description', label: 'Description' },
        { key: 'defaultViewId', label: 'Default View ID' },
        { key: 'lastModifiedTime', label: 'Last Modified Time', format: 'datetime' },
      ],
    },
  ],
};

const listFields: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'fields',
      label: 'Fields',
      value: '',
      labelKey: 'name',
      listItems: fieldFields,
    },
  ],
};

const listViews: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'views',
      label: 'Views',
      value: '',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'View ID' },
        { key: 'name', label: 'View Name' },
        { key: 'type', label: 'Type' },
      ],
    },
  ],
};

const createTable: OutputSchema = {
  fields: [
    { key: 'id', label: 'Table ID' },
    { key: 'name', label: 'Table Name' },
    { key: 'description', label: 'Description' },
    { key: 'dbTableName', label: 'Database Table Name' },
    { key: 'defaultViewId', label: 'Default View ID' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Field ID' },
        { key: 'name', label: 'Field Name' },
        { key: 'type', label: 'Type' },
        { key: 'isPrimary', label: 'Is Primary', format: 'boolean' },
      ],
    },
  ],
};

const createField: OutputSchema = {
  fields: fieldFields,
};

const baseSchema: OutputSchema = {
  fields: [
    { key: 'baseId', label: 'Base ID' },
    { key: 'tableCount', label: 'Table Count', format: 'number' },
    {
      key: 'tables',
      label: 'Tables',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Table ID' },
        { key: 'name', label: 'Table Name' },
        { key: 'description', label: 'Description' },
        {
          key: 'fields',
          label: 'Fields',
          labelKey: 'name',
          listItems: [
            { key: 'id', label: 'Field ID' },
            { key: 'name', label: 'Field Name' },
            { key: 'type', label: 'Type' },
            { key: 'isPrimary', label: 'Is Primary', format: 'boolean' },
            { key: 'writable', label: 'Writable', format: 'boolean' },
            { key: 'notNull', label: 'Required', format: 'boolean' },
            { key: 'unique', label: 'Unique', format: 'boolean' },
            {
              key: 'options',
              label: 'Select Options',
              labelKey: 'name',
              listItems: [
                { key: 'id', label: 'Option ID' },
                { key: 'name', label: 'Option Name' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const upsertRecord: OutputSchema = {
  fields: [
    { key: 'action', label: 'Action' },
    { key: 'record', label: 'Record', children: recordCoreFields },
    { key: 'warning', label: 'Warning' },
  ],
};

const searchRecords: OutputSchema = {
  fields: [
    {
      key: 'records',
      label: 'Records',
      labelKey: 'name',
      listItems: recordFields,
    },
    { key: 'recordCount', label: 'Record Count', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
  ],
};

export const teableOutputSchemas = {
  record,
  recordCore,
  createRecord,
  listRecords,
  updatedRecords,
  deleteRecord,
  deleteRecords,
  addComment,
  listBases,
  listTables,
  listFields,
  listViews,
  createTable,
  createField,
  baseSchema,
  upsertRecord,
  searchRecords,
};
