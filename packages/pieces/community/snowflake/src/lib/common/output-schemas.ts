import {
  OutputSchema,
  OutputSchemaField,
} from '@activepieces/pieces-framework';

const rowColumnsField: OutputSchemaField = {
  key: 'columns',
  label: 'Row Columns',
  value: '',
  dynamicKey: true,
};

const rowsField: OutputSchemaField = {
  key: 'rows',
  label: 'Rows',
  description:
    'Each row is an object keyed by column name (Snowflake upper-cases unquoted names).',
  listItems: [rowColumnsField],
};

const queryIdField: OutputSchemaField = { key: 'queryId', label: 'Query ID' };

const columnFields: OutputSchemaField[] = [
  { key: 'column_name', label: 'Column Name' },
  { key: 'data_type', label: 'Data Type' },
  { key: 'nullable', label: 'Nullable (Y/N)' },
  { key: 'default_value', label: 'Default Value' },
  { key: 'primary_key', label: 'Primary Key (Y/N)' },
  { key: 'unique_key', label: 'Unique Key (Y/N)' },
  { key: 'check', label: 'Check' },
  { key: 'expression', label: 'Expression' },
  { key: 'comment', label: 'Comment' },
];

const tableFields: OutputSchemaField[] = [
  { key: 'table_name', label: 'Table Name' },
  { key: 'database_name', label: 'Database' },
  { key: 'schema_name', label: 'Schema' },
  { key: 'kind', label: 'Kind' },
  { key: 'rows', label: 'Row Count', format: 'number' },
  { key: 'bytes', label: 'Size', format: 'filesize' },
  { key: 'owner', label: 'Owner' },
  { key: 'comment', label: 'Comment' },
  { key: 'created_on', label: 'Created On', format: 'datetime' },
];

const viewFields: OutputSchemaField[] = [
  { key: 'view_name', label: 'View Name' },
  { key: 'database_name', label: 'Database' },
  { key: 'schema_name', label: 'Schema' },
  { key: 'owner', label: 'Owner' },
  { key: 'comment', label: 'Comment' },
  { key: 'text', label: 'Definition' },
  { key: 'is_secure', label: 'Secure' },
  { key: 'is_materialized', label: 'Materialized' },
  { key: 'created_on', label: 'Created On', format: 'datetime' },
];

const listMeta: OutputSchemaField[] = [
  { key: 'count', label: 'Count', format: 'number' },
  {
    key: 'truncated',
    label: 'Truncated',
    format: 'boolean',
    description:
      'True when more items exist than were returned; narrow the pattern or raise the limit.',
  },
];

function listSchema({
  fields,
  labelKey,
}: {
  fields: OutputSchemaField[];
  labelKey: string;
}): OutputSchema {
  return {
    fields: [
      { key: 'items', label: 'Items', labelKey, listItems: fields },
      ...listMeta,
    ],
  };
}

export const rawRowsOutputSchema: OutputSchema = {
  fields: [
    { key: 'rows', label: 'Rows', value: '', listItems: [rowColumnsField] },
  ],
  itemLabel: 'Row',
};

export const queryResultOutputSchema: OutputSchema = {
  fields: [
    { key: 'columns', label: 'Columns' },
    rowsField,
    { key: 'rowCount', label: 'Rows Returned', format: 'number' },
    { key: 'totalRows', label: 'Total Rows in Result', format: 'number' },
    { key: 'truncated', label: 'Truncated', format: 'boolean' },
    queryIdField,
  ],
};

export const multipleQueriesOutputSchema: OutputSchema = {
  fields: [
    { key: 'query', label: 'Query' },
    { key: 'result', label: 'Result Rows' },
  ],
  itemLabel: '{query}',
};

export const findRowsOutputSchema: OutputSchema = {
  fields: [
    rowsField,
    { key: 'rowCount', label: 'Rows Returned', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
    { key: 'nextOffset', label: 'Next Offset', format: 'number' },
  ],
};

export const countRowsOutputSchema: OutputSchema = {
  fields: [{ key: 'count', label: 'Count', format: 'number' }],
};

export const getRowOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'row', label: 'Row', dynamicKey: true },
  ],
};

export const getRowByIdOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    rowColumnsField,
  ],
};

export const insertResultOutputSchema: OutputSchema = {
  fields: [
    { key: 'rowsInserted', label: 'Rows Inserted', format: 'number' },
    queryIdField,
  ],
};

export const legacyInsertOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'number of rows inserted',
      label: 'Rows Inserted',
      format: 'number',
    },
  ],
  itemLabel: 'Result',
};

export const legacyInsertManyOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'rows_inserted', label: 'Rows Inserted', format: 'number' },
  ],
};

export const legacyUpdateOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'rows_updated', label: 'Rows Updated', format: 'number' },
  ],
};

export const legacyDeleteOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'rows_deleted', label: 'Rows Deleted', format: 'number' },
  ],
};

export const legacyUpsertOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'rows_inserted', label: 'Rows Inserted', format: 'number' },
    { key: 'rows_updated', label: 'Rows Updated', format: 'number' },
  ],
};

export const upsertOutputSchema: OutputSchema = {
  fields: [
    { key: 'rowsInserted', label: 'Rows Inserted', format: 'number' },
    { key: 'rowsUpdated', label: 'Rows Updated', format: 'number' },
    queryIdField,
  ],
};

export const updateByKeyOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'rowsAffected', label: 'Rows Updated', format: 'number' },
  ],
};

export const updateByFilterOutputSchema: OutputSchema = {
  fields: [{ key: 'rowsAffected', label: 'Rows Updated', format: 'number' }],
};

export const deleteByKeyOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'alreadyDeleted', label: 'Already Deleted', format: 'boolean' },
  ],
};

export const deleteByFilterOutputSchema: OutputSchema = {
  fields: [{ key: 'rowsDeleted', label: 'Rows Deleted', format: 'number' }],
};

export const tableSchemaOutputSchema: OutputSchema = {
  fields: [
    { key: 'table', label: 'Table' },
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'column_name',
      listItems: columnFields,
    },
  ],
};

export const listTablesOutputSchema: OutputSchema = {
  fields: tableFields,
  itemLabel: '{table_name}',
};

export const listTablesAiOutputSchema = listSchema({
  fields: tableFields,
  labelKey: 'table_name',
});
export const listViewsOutputSchema = listSchema({
  fields: viewFields,
  labelKey: 'view_name',
});

export const listDatabasesOutputSchema = listSchema({
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'owner', label: 'Owner' },
    { key: 'kind', label: 'Kind' },
    { key: 'comment', label: 'Comment' },
    { key: 'created_on', label: 'Created On', format: 'datetime' },
  ],
  labelKey: 'name',
});

export const listSchemasOutputSchema = listSchema({
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'database_name', label: 'Database' },
    { key: 'owner', label: 'Owner' },
    { key: 'comment', label: 'Comment' },
    { key: 'created_on', label: 'Created On', format: 'datetime' },
  ],
  labelKey: 'name',
});

export const listWarehousesOutputSchema = listSchema({
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'state', label: 'State' },
    { key: 'type', label: 'Type' },
    { key: 'size', label: 'Size' },
    { key: 'auto_suspend', label: 'Auto Suspend (s)', format: 'number' },
    { key: 'auto_resume', label: 'Auto Resume' },
    { key: 'is_current', label: 'Is Current' },
    { key: 'owner', label: 'Owner' },
    { key: 'comment', label: 'Comment' },
    { key: 'created_on', label: 'Created On', format: 'datetime' },
  ],
  labelKey: 'name',
});

export const listStagesOutputSchema = listSchema({
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'database_name', label: 'Database' },
    { key: 'schema_name', label: 'Schema' },
    { key: 'type', label: 'Type' },
    { key: 'url', label: 'URL' },
    { key: 'owner', label: 'Owner' },
    { key: 'comment', label: 'Comment' },
    { key: 'created_on', label: 'Created On', format: 'datetime' },
  ],
  labelKey: 'name',
});

export const listStageFilesOutputSchema = listSchema({
  fields: [
    { key: 'name', label: 'File Name' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'md5', label: 'MD5' },
    { key: 'last_modified', label: 'Last Modified' },
  ],
  labelKey: 'name',
});

export const listProceduresOutputSchema = listSchema({
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'schema_name', label: 'Schema' },
    { key: 'database_name', label: 'Database' },
    { key: 'arguments', label: 'Signature' },
    { key: 'description', label: 'Description' },
    { key: 'created_on', label: 'Created On', format: 'datetime' },
  ],
  labelKey: 'name',
});

export const listRolesOutputSchema = listSchema({
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'is_current', label: 'Is Current' },
    { key: 'is_default', label: 'Is Default' },
    { key: 'granted_to_roles', label: 'Granted to Roles', format: 'number' },
    { key: 'granted_roles', label: 'Granted Roles', format: 'number' },
    { key: 'owner', label: 'Owner' },
    { key: 'comment', label: 'Comment' },
    { key: 'created_on', label: 'Created On', format: 'datetime' },
  ],
  labelKey: 'name',
});

export const listColumnsOutputSchema = listSchema({
  fields: [
    { key: 'table_schema', label: 'Schema' },
    { key: 'table_name', label: 'Table' },
    { key: 'column_name', label: 'Column' },
    { key: 'ordinal_position', label: 'Position', format: 'number' },
    { key: 'data_type', label: 'Data Type' },
    { key: 'is_nullable', label: 'Nullable' },
    { key: 'column_default', label: 'Default' },
    { key: 'comment', label: 'Comment' },
  ],
  labelKey: 'column_name',
});

export const queryHistoryOutputSchema = listSchema({
  fields: [
    { key: 'query_id', label: 'Query ID' },
    { key: 'query_text', label: 'Query Text' },
    { key: 'execution_status', label: 'Status' },
    { key: 'user_name', label: 'User' },
    { key: 'role_name', label: 'Role' },
    { key: 'warehouse_name', label: 'Warehouse' },
    { key: 'start_time', label: 'Start Time', format: 'datetime' },
    { key: 'end_time', label: 'End Time', format: 'datetime' },
    { key: 'total_elapsed_time', label: 'Elapsed (ms)', format: 'number' },
    { key: 'rows_produced', label: 'Rows Produced', format: 'number' },
    { key: 'error_message', label: 'Error Message' },
  ],
  labelKey: 'query_id',
});

export const describeTableOutputSchema: OutputSchema = {
  fields: [
    { key: 'table', label: 'Table' },
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Data Type' },
        { key: 'nullable', label: 'Nullable', format: 'boolean' },
        { key: 'default', label: 'Default' },
        { key: 'primaryKey', label: 'Primary Key', format: 'boolean' },
        { key: 'uniqueKey', label: 'Unique Key', format: 'boolean' },
        { key: 'comment', label: 'Comment' },
      ],
    },
  ],
};

export const viewDefinitionOutputSchema: OutputSchema = {
  fields: [
    { key: 'view', label: 'View' },
    { key: 'ddl', label: 'DDL' },
  ],
};

export const explainOutputSchema: OutputSchema = {
  fields: [{ key: 'plan', label: 'Plan', dynamicKey: true }],
};

export const queryStatusOutputSchema: OutputSchema = {
  fields: [
    { key: 'queryId', label: 'Query ID' },
    { key: 'status', label: 'Status' },
    { key: 'isRunning', label: 'Is Running', format: 'boolean' },
    { key: 'isError', label: 'Is Error', format: 'boolean' },
    rowsField,
    { key: 'rowCount', label: 'Rows Returned', format: 'number' },
    { key: 'truncated', label: 'Truncated', format: 'boolean' },
  ],
};

export const cancelQueryOutputSchema: OutputSchema = {
  fields: [
    { key: 'queryId', label: 'Query ID' },
    { key: 'message', label: 'Message' },
  ],
};

export const copyIntoOutputSchema: OutputSchema = {
  fields: [
    { key: 'filesProcessed', label: 'Files Processed', format: 'number' },
    { key: 'rowsLoaded', label: 'Rows Loaded', format: 'number' },
    {
      key: 'files',
      label: 'Files',
      labelKey: 'file',
      listItems: [
        { key: 'file', label: 'File' },
        { key: 'status', label: 'Status' },
        { key: 'rows_parsed', label: 'Rows Parsed', format: 'number' },
        { key: 'rows_loaded', label: 'Rows Loaded', format: 'number' },
        { key: 'error_limit', label: 'Error Limit', format: 'number' },
        { key: 'errors_seen', label: 'Errors Seen', format: 'number' },
        { key: 'first_error', label: 'First Error' },
      ],
    },
  ],
};

export const legacyLoadOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'files_processed', label: 'Files Processed', format: 'number' },
    { key: 'rows_loaded', label: 'Rows Loaded', format: 'number' },
    {
      key: 'files',
      label: 'Files',
      labelKey: 'file',
      listItems: [
        { key: 'file', label: 'File' },
        { key: 'status', label: 'Status' },
        { key: 'rows_parsed', label: 'Rows Parsed', format: 'number' },
        { key: 'rows_loaded', label: 'Rows Loaded', format: 'number' },
        { key: 'error_limit', label: 'Error Limit', format: 'number' },
        { key: 'errors_seen', label: 'Errors Seen', format: 'number' },
        { key: 'first_error', label: 'First Error' },
      ],
    },
  ],
};

export const callProcedureOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'result',
      label: 'Result',
      description:
        'The value returned by the procedure (first column of the first row).',
    },
    rowsField,
    { key: 'rowCount', label: 'Rows Returned', format: 'number' },
    { key: 'truncated', label: 'Truncated', format: 'boolean' },
    queryIdField,
  ],
};

export const legacyProcedureOutputSchema: OutputSchema = {
  fields: [{ key: 'result', label: 'Result Rows' }],
};

export const dynamicTableOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'table', label: 'Table' },
    { key: 'target_lag', label: 'Target Lag' },
    { key: 'warehouse', label: 'Warehouse' },
  ],
};

export const sessionOutputSchema: OutputSchema = {
  fields: [
    { key: 'user', label: 'User' },
    { key: 'role', label: 'Role' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'database', label: 'Database' },
    { key: 'schema', label: 'Schema' },
    { key: 'account', label: 'Account' },
    { key: 'region', label: 'Region' },
    { key: 'version', label: 'Snowflake Version' },
  ],
};

export const rowTriggerOutputSchema: OutputSchema = {
  fields: [rowColumnsField],
};

export const newColumnOutputSchema: OutputSchema = {
  fields: [
    { key: 'column_name', label: 'Column Name' },
    { key: 'data_type', label: 'Data Type' },
    { key: 'nullable', label: 'Nullable (Y/N)' },
    { key: 'default_value', label: 'Default Value' },
    { key: 'primary_key', label: 'Primary Key (Y/N)' },
    { key: 'unique_key', label: 'Unique Key (Y/N)' },
    { key: 'comment', label: 'Comment' },
    { key: 'position', label: 'Position', format: 'number' },
    { key: 'table', label: 'Table' },
  ],
};

export const newTableOutputSchema: OutputSchema = { fields: tableFields };
export const newViewOutputSchema: OutputSchema = { fields: viewFields };
