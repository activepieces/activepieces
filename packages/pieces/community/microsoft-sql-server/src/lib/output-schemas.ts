import { OutputSchema } from '@activepieces/pieces-framework';

export const getTablesActionOutputSchema: OutputSchema = {
  itemLabel: '{full_name}',
  fields: [
    {
      key: 'tables',
      label: 'Tables',
      value: '',
      listItems: [
        { key: 'table_schema', label: 'Schema' },
        { key: 'table_name', label: 'Table Name' },
        { key: 'full_name', label: 'Qualified Name' },
      ],
    },
  ],
};

export const runQueryActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Rows',
      description:
        'The rows the statement returned, with whatever columns it selected. Empty for a statement that returns none, such as an INSERT or UPDATE.',
    },
    {
      key: 'result_sets',
      label: 'Result Sets',
      description:
        'Every result set the statement produced, in order, for a batch or a stored procedure that returns more than one. The first is the same as Rows.',
    },
    {
      key: 'row_count',
      label: 'Row Count',
      format: 'number',
      description: 'How many rows the first result set returned.',
    },
    {
      key: 'rows_affected',
      label: 'Rows Affected',
      format: 'number',
      description:
        'How many rows SQL Server reported for the statement. It counts rows returned by a SELECT as well as rows written, so on a read this matches Row Count rather than being zero.',
    },
  ],
};

export const insertRowActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'row', label: 'Inserted Row', value: '', dynamicKey: true },
  ],
};

export const insertRowsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Inserted Rows',
      description:
        'The inserted rows as stored by the database, including IDENTITY ids and defaults; each row\'s fields are the columns of the target table. Only present when Return Inserted Rows is enabled.',
    },
    { key: 'row_count', label: 'Inserted Row Count', format: 'number' },
  ],
};

export const newOrUpdatedRowTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'row',
      label: 'Row',
      value: '',
      dynamicKey: true,
      description:
        'One row of the table you selected, carrying every column it has. Each poll hands over one event per row. Columns SQL Server would round on the way out — decimal, money and the date and time family — arrive as exact strings rather than numbers or dates.',
    },
  ],
};

export const findRowsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Found Rows',
      value: '',
      description:
        'Every matching row, carrying the columns you selected or all of them when none were chosen.',
    },
  ],
};

export const writeRowsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Affected Rows',
      description:
        'The rows as they stand after the write, or the rows that were removed. Empty when the table has enabled triggers, since SQL Server will not return them in that case -- use Rows Affected instead.',
    },
    {
      key: 'rows_affected',
      label: 'Rows Affected',
      format: 'number',
      description:
        'How many rows the statement changed. Always populated, including on tables with triggers.',
    },
  ],
};

export const microsoftSqlServerCallProcedureOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'result_sets',
      label: 'Result Sets',
      description: 'Every result set the procedure selected, in order, each a list of rows.',
    },
    {
      key: 'output_parameters',
      label: 'Output Parameters',
      value: '',
      dynamicKey: true,
      description: 'The final value of each OUTPUT parameter, keyed by its name without the @.',
    },
    { key: 'return_value', label: 'Return Value', format: 'number' },
    { key: 'rows_affected', label: 'Rows Affected', format: 'number' },
  ],
};

export const microsoftSqlServerCountRowsOutputSchema: OutputSchema = {
  fields: [{ key: 'count', label: 'Row Count', format: 'number' }],
};

export const microsoftSqlServerDescribeTableOutputSchema: OutputSchema = {
  fields: [
    { key: 'schema', label: 'Schema' },
    { key: 'table', label: 'Table' },
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Base Type' },
        { key: 'is_nullable', label: 'Nullable', format: 'boolean' },
        { key: 'is_identity', label: 'Identity', format: 'boolean' },
        { key: 'is_computed', label: 'Computed', format: 'boolean' },
        { key: 'default_value', label: 'Default Value' },
        { key: 'is_primary_key', label: 'Primary Key', format: 'boolean' },
        { key: 'references_table', label: 'References Table' },
        { key: 'references_column', label: 'References Column' },
        { key: 'data_type', label: 'Data Type' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const microsoftSqlServerExplainQueryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'plans',
      label: 'Plans',
      description: 'The estimated execution plan of each statement, as showplan XML.',
    },
    { key: 'count', label: 'Plan Count', format: 'number' },
  ],
};

export const microsoftSqlServerFindRowsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Found Rows',
      value: '',
      description:
        'The matching rows of this page, with the columns you asked for or all of them. Decimal, money and date and time columns arrive as exact strings.',
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};

export const microsoftSqlServerGetRowByKeyOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    {
      key: 'row',
      label: 'Row',
      value: '',
      dynamicKey: true,
      description:
        'The matching row with every column of the table, or null when none matched. Decimal, money and date and time columns arrive as exact strings.',
    },
  ],
};

export const microsoftSqlServerGetServerInfoOutputSchema: OutputSchema = {
  fields: [
    { key: 'version', label: 'Version' },
    { key: 'product_version', label: 'Product Version' },
    { key: 'product_level', label: 'Product Level' },
    { key: 'edition', label: 'Edition' },
    { key: 'engine_edition', label: 'Engine Edition', format: 'number' },
    { key: 'server_name', label: 'Server Name' },
    { key: 'server_collation', label: 'Server Collation' },
    { key: 'database', label: 'Database' },
    { key: 'compatibility_level', label: 'Compatibility Level', format: 'number' },
    { key: 'login', label: 'Login' },
    { key: 'user', label: 'User' },
    { key: 'default_schema', label: 'Default Schema' },
    { key: 'server_time', label: 'Server Time', format: 'datetime' },
  ],
};

export const microsoftSqlServerGetViewDefinitionOutputSchema: OutputSchema = {
  fields: [
    { key: 'schema', label: 'Schema' },
    { key: 'view', label: 'View' },
    { key: 'definition', label: 'Definition' },
  ],
};

export const microsoftSqlServerListDatabasesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'databases',
      label: 'Databases',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'database_id', label: 'Database ID', format: 'number' },
        { key: 'state', label: 'State' },
        { key: 'recovery_model', label: 'Recovery Model' },
        { key: 'compatibility_level', label: 'Compatibility Level', format: 'number' },
        { key: 'collation_name', label: 'Collation' },
        { key: 'is_read_only', label: 'Read Only', format: 'boolean' },
        { key: 'is_current', label: 'Current', format: 'boolean' },
        { key: 'create_date', label: 'Created', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const microsoftSqlServerListIndexesOutputSchema: OutputSchema = {
  fields: [
    { key: 'schema', label: 'Schema' },
    { key: 'table', label: 'Table' },
    {
      key: 'indexes',
      label: 'Indexes',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'is_primary_key', label: 'Primary Key', format: 'boolean' },
        { key: 'is_unique', label: 'Unique', format: 'boolean' },
        { key: 'is_unique_constraint', label: 'Unique Constraint', format: 'boolean' },
        { key: 'is_disabled', label: 'Disabled', format: 'boolean' },
        { key: 'filter', label: 'Filter' },
        {
          key: 'key_columns',
          label: 'Key Columns',
          labelKey: 'name',
          listItems: [
            { key: 'name', label: 'Name' },
            { key: 'descending', label: 'Descending', format: 'boolean' },
          ],
        },
        { key: 'included_columns', label: 'Included Columns' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const microsoftSqlServerListRoutinesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'routines',
      label: 'Routines',
      labelKey: 'name',
      listItems: [
        { key: 'schema', label: 'Schema' },
        { key: 'name', label: 'Name' },
        { key: 'kind', label: 'Kind' },
        {
          key: 'parameters',
          label: 'Parameters',
          labelKey: 'name',
          listItems: [
            { key: 'name', label: 'Name' },
            { key: 'data_type', label: 'Data Type' },
            { key: 'is_output', label: 'Output', format: 'boolean' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const microsoftSqlServerListSchemasOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'schemas',
      label: 'Schemas',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'owner', label: 'Owner' },
        { key: 'table_count', label: 'Table Count', format: 'number' },
        { key: 'view_count', label: 'View Count', format: 'number' },
        { key: 'is_default', label: 'Default Schema', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const microsoftSqlServerListSessionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'sessions',
      label: 'Sessions',
      listItems: [
        { key: 'session_id', label: 'Session ID', format: 'number' },
        { key: 'login_name', label: 'Login Name' },
        { key: 'host_name', label: 'Host Name' },
        { key: 'program_name', label: 'Program Name' },
        { key: 'database', label: 'Database' },
        { key: 'status', label: 'Status' },
        { key: 'command', label: 'Command' },
        { key: 'wait_type', label: 'Wait Type' },
        { key: 'blocking_session_id', label: 'Blocking Session ID', format: 'number' },
        { key: 'elapsed_ms', label: 'Elapsed (ms)', format: 'number' },
        { key: 'cpu_ms', label: 'CPU Time (ms)', format: 'number' },
        { key: 'sql_text', label: 'SQL Text' },
        { key: 'login_time', label: 'Login Time', format: 'datetime' },
        { key: 'is_current', label: 'Current', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const microsoftSqlServerListViewsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'views',
      label: 'Views',
      labelKey: 'name',
      listItems: [
        { key: 'schema', label: 'Schema' },
        { key: 'name', label: 'Name' },
        { key: 'is_schema_bound', label: 'Schema Bound', format: 'boolean' },
        { key: 'is_indexed', label: 'Indexed', format: 'boolean' },
        { key: 'create_date', label: 'Created', format: 'datetime' },
        { key: 'modify_date', label: 'Modified', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const microsoftSqlServerRunSelectQueryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Rows',
      value: '',
      description: 'The rows of the first result set, with whatever columns the query selected.',
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};

export const microsoftSqlServerUpsertRowOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'action',
      label: 'Action',
      description: 'INSERT or UPDATE; unchanged when the row existed and there was nothing to update; null when the table has triggers.',
    },
    {
      key: 'row',
      label: 'Row',
      value: '',
      dynamicKey: true,
      description:
        'The row as stored after the insert or update, with every column of the table. Null when the table has triggers or nothing changed.',
    },
    { key: 'rows_affected', label: 'Rows Affected', format: 'number' },
  ],
};
