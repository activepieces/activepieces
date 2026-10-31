import { OutputSchema } from '@activepieces/pieces-framework';

const recordFields: OutputSchema['fields'] = [{ key: 'id', label: 'Record ID', description: 'Full record id in "table:id" form; the other fields are the record\'s own data.' }];

const permissionFields: OutputSchema['fields'] = [
  { key: 'select', label: 'Select' },
  { key: 'create', label: 'Create' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
];

const tableFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'Internal ID', format: 'number' },
  { key: 'kind', label: 'Kind', children: [{ key: 'kind', label: 'Kind' }] },
  { key: 'schemafull', label: 'Schemafull', format: 'boolean' },
  { key: 'drop', label: 'Drop', format: 'boolean' },
  { key: 'permissions', label: 'Permissions', children: permissionFields },
];

const pageFields: OutputSchema['fields'] = [
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'has_more', label: 'Has More', format: 'boolean' },
  { key: 'next_start', label: 'Next Start', format: 'number' },
];

const recordsListFields: OutputSchema['fields'] = [
  { key: 'records', label: 'Records', labelKey: 'id', listItems: recordFields },
  { key: 'count', label: 'Count', format: 'number' },
];

export const runQueryOutputSchema: OutputSchema = {
  itemLabel: 'Statement {status}',
  fields: [
    {
      key: 'statements',
      label: 'Statements',
      value: '',
      listItems: [
        { key: 'status', label: 'Status' },
        { key: 'result', label: 'Result' },
        { key: 'time', label: 'Time' },
      ],
    },
  ],
};

export const surrealdbCountRecordsOutputSchema: OutputSchema = {
  fields: [{ key: 'count', label: 'Count', format: 'number' }],
};

export const surrealdbRecordOutputSchema: OutputSchema = {
  fields: recordFields,
};

export const surrealdbRecordsOutputSchema: OutputSchema = {
  fields: recordsListFields,
};

export const surrealdbDescribeTableOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'kind', label: 'Type' },
        { key: 'readonly', label: 'Read Only', format: 'boolean' },
        { key: 'table', label: 'Table' },
        { key: 'permissions', label: 'Permissions', children: permissionFields.filter((field) => field.key !== 'delete') },
      ],
    },
    {
      key: 'indexes',
      label: 'Indexes',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'cols', label: 'Columns' },
        { key: 'index', label: 'Index Type' },
        { key: 'table', label: 'Table' },
      ],
    },
    { key: 'events', label: 'Events' },
    { key: 'lives', label: 'Live Queries' },
    { key: 'tables', label: 'Views' },
  ],
};

export const surrealdbExportDatabaseOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'file_name', label: 'File Name' },
    { key: 'size_bytes', label: 'Size', format: 'filesize' },
  ],
};

export const surrealdbFindRecordsOutputSchema: OutputSchema = {
  fields: [{ key: 'records', label: 'Records', labelKey: 'id', listItems: recordFields }, ...pageFields],
};

export const surrealdbFindRelatedRecordsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'edges',
      label: 'Edges',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Edge ID' },
        { key: 'in', label: 'From Record ID' },
        { key: 'out', label: 'To Record ID' },
        { key: 'related', label: 'Related Record', children: recordFields },
      ],
    },
    ...pageFields,
  ],
};

export const surrealdbGetDatabaseInfoOutputSchema: OutputSchema = {
  fields: [
    { key: 'tables', label: 'Tables', labelKey: 'name', listItems: tableFields },
    {
      key: 'functions',
      label: 'Functions',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'args', label: 'Arguments' },
        { key: 'block', label: 'Body' },
        { key: 'permissions', label: 'Permissions' },
      ],
    },
    { key: 'params', label: 'Params' },
    { key: 'accesses', label: 'Accesses' },
    { key: 'analyzers', label: 'Analyzers' },
    { key: 'users', label: 'Users' },
    { key: 'sequences', label: 'Sequences' },
    { key: 'apis', label: 'APIs' },
    { key: 'buckets', label: 'Buckets' },
    { key: 'configs', label: 'Configs' },
    { key: 'models', label: 'Models' },
    { key: 'modules', label: 'Modules' },
  ],
};

export const surrealdbImportDataOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'size_bytes', label: 'Size', format: 'filesize' },
  ],
};

export const surrealdbListDatabasesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'databases',
      label: 'Databases',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'id', label: 'Internal ID', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const surrealdbListNamespacesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'namespaces',
      label: 'Namespaces',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'id', label: 'Internal ID', format: 'number' },
        { key: 'comment', label: 'Comment' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const surrealdbListTablesOutputSchema: OutputSchema = {
  fields: [
    { key: 'tables', label: 'Tables', labelKey: 'name', listItems: tableFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const surrealdbRelateRecordsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Edge ID' },
    { key: 'in', label: 'From Record ID' },
    { key: 'out', label: 'To Record ID' },
  ],
};

export const surrealdbRunFunctionOutputSchema: OutputSchema = {
  fields: [{ key: 'result', label: 'Result' }],
};

export const surrealdbRunGqlQueryOutputSchema: OutputSchema = {
  fields: [{ key: 'result', label: 'Result' }],
};

export const surrealdbRunGraphqlQueryOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'Data', dynamicKey: true }],
};
