import { OutputSchema } from '@activepieces/pieces-framework';

export const insertRowOutputSchema: OutputSchema = {
  fields: [
    { key: 'affectedRows', label: 'Affected Rows', format: 'number' },
    {
      key: 'insertId',
      label: 'Insert ID',
      format: 'number',
      description: 'Auto-increment id of the inserted row (0 when the table has no auto-increment column).',
    },
    { key: 'warningCount', label: 'Warning Count', format: 'number' },
    { key: 'message', label: 'Message' },
  ],
};

export const insertRowsOutputSchema: OutputSchema = {
  fields: [
    { key: 'affectedRows', label: 'Inserted Rows', format: 'number' },
    {
      key: 'firstInsertId',
      label: 'First Insert ID',
      format: 'number',
      description: 'Auto-increment id of the first inserted row (0 when the table has no auto-increment column). MySQL reports only this one id; the other rows follow it in sequence.',
    },
  ],
};

export const updateRowOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'affectedRows',
      label: 'Matched Rows',
      format: 'number',
      description: 'Rows matched by the search condition.',
    },
    {
      key: 'changedRows',
      label: 'Changed Rows',
      format: 'number',
      description: 'Rows whose values actually changed.',
    },
    { key: 'warningCount', label: 'Warning Count', format: 'number' },
    { key: 'message', label: 'Message' },
  ],
};

export const deleteRowOutputSchema: OutputSchema = {
  fields: [
    { key: 'affectedRows', label: 'Deleted Rows', format: 'number' },
    { key: 'warningCount', label: 'Warning Count', format: 'number' },
    { key: 'message', label: 'Message' },
  ],
};

export const findRowsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Rows',
      description: 'Rows matching the condition; each row\'s fields are the columns of the queried table.',
    },
  ],
};

export const getTablesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tables',
      label: 'Tables',
      description: 'Names of the tables in the connected database.',
    },
  ],
};

export const mysqlListDatabasesOutputSchema: OutputSchema = {
  fields: [
    { key: 'databases', label: 'Databases', description: 'Names of the databases the connection user can see.' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const mysqlDescribeTableOutputSchema: OutputSchema = {
  fields: [
    { key: 'table', label: 'Table' },
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'dataType', label: 'Data Type' },
        { key: 'columnType', label: 'Column Type', description: 'Full type with length and options, e.g. varchar(120) or int unsigned.' },
        { key: 'nullable', label: 'Nullable', format: 'boolean' },
        { key: 'defaultValue', label: 'Default Value' },
        { key: 'columnKey', label: 'Key', description: 'PRI for primary key, UNI for unique, MUL for a non-unique index, empty otherwise.' },
        { key: 'extra', label: 'Extra', description: 'auto_increment, DEFAULT_GENERATED, VIRTUAL GENERATED and similar.' },
        { key: 'comment', label: 'Comment' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const mysqlListIndexesOutputSchema: OutputSchema = {
  fields: [
    { key: 'table', label: 'Table' },
    {
      key: 'indexes',
      label: 'Indexes',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'unique', label: 'Unique', format: 'boolean' },
        { key: 'type', label: 'Type' },
        { key: 'columns', label: 'Columns', description: 'Column names in index order.' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const mysqlListViewsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'views',
      label: 'Views',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'updatable', label: 'Updatable', format: 'boolean' },
        { key: 'securityType', label: 'Security Type' },
        { key: 'definer', label: 'Definer' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const mysqlGetViewDefinitionOutputSchema: OutputSchema = {
  fields: [
    { key: 'view', label: 'View' },
    { key: 'definition', label: 'Definition', description: 'The CREATE VIEW statement.' },
    { key: 'characterSetClient', label: 'Character Set Client' },
    { key: 'collationConnection', label: 'Collation Connection' },
  ],
};

export const mysqlListRoutinesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'routines',
      label: 'Routines',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type', description: 'PROCEDURE or FUNCTION.' },
        { key: 'returns', label: 'Returns', description: 'Return type of a function; empty for procedures.' },
        { key: 'comment', label: 'Comment' },
        {
          key: 'parameters',
          label: 'Parameters',
          labelKey: 'name',
          listItems: [
            { key: 'mode', label: 'Mode', description: 'IN, OUT or INOUT; empty for function parameters.' },
            { key: 'name', label: 'Name' },
            { key: 'type', label: 'Type' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const mysqlFindRowsOutputSchema: OutputSchema = {
  fields: [
    { key: 'rows', label: 'Rows', description: 'Matching rows; each row\'s fields are the columns of the table.' },
    { key: 'count', label: 'Count', format: 'number', description: 'Rows on this page.' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
    { key: 'nextOffset', label: 'Next Offset', format: 'number', description: 'Offset for the next page; empty on the last page.' },
  ],
};

export const mysqlGetRowByKeyOutputSchema: OutputSchema = {
  fields: [
    { key: 'row', label: 'Row', description: 'The matching row; its fields are the columns of the table.' },
  ],
};

export const mysqlCountRowsOutputSchema: OutputSchema = {
  fields: [{ key: 'count', label: 'Count', format: 'number' }],
};

export const mysqlInsertRowsOutputSchema: OutputSchema = {
  fields: [
    { key: 'affectedRows', label: 'Inserted Rows', format: 'number' },
    {
      key: 'firstInsertId',
      label: 'First Insert ID',
      format: 'number',
      description: 'Auto-increment id of the first inserted row (0 when the table has no auto-increment column).',
    },
  ],
};

export const mysqlUpsertRowOutputSchema: OutputSchema = {
  fields: [
    { key: 'affectedRows', label: 'Affected Rows', format: 'number', description: '1 when a row was inserted, 2 when an existing row was updated.' },
    { key: 'insertId', label: 'Insert ID', format: 'number', description: 'Auto-increment id of the inserted or updated row (0 when the table has none).' },
  ],
};

export const mysqlUpdateRowsOutputSchema: OutputSchema = {
  fields: [
    { key: 'matchedRows', label: 'Matched Rows', format: 'number' },
    { key: 'changedRows', label: 'Changed Rows', format: 'number', description: 'Matched rows whose values actually changed.' },
  ],
};

export const mysqlDeleteRowsOutputSchema: OutputSchema = {
  fields: [{ key: 'deletedRows', label: 'Deleted Rows', format: 'number' }],
};

export const mysqlRunSelectQueryOutputSchema: OutputSchema = {
  fields: [
    { key: 'rows', label: 'Rows', description: 'Rows the query returned; each row\'s fields are the selected columns.' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean', description: 'True when the query produced more rows than Limit.' },
  ],
};

export const mysqlExplainQueryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'plan',
      label: 'Plan',
      description: 'EXPLAIN FORMAT=JSON output; its shape follows the query (tables, joins, subqueries).',
      children: [
        {
          key: 'query_block',
          label: 'Query Block',
          children: [
            { key: 'select_id', label: 'Select ID', format: 'number' },
            { key: 'cost_info', label: 'Cost Info', children: [{ key: 'query_cost', label: 'Query Cost' }] },
          ],
        },
      ],
    },
  ],
};

export const mysqlCallProcedureOutputSchema: OutputSchema = {
  fields: [
    { key: 'resultSets', label: 'Result Sets', description: 'One list of rows per SELECT the procedure ran, in order.' },
    { key: 'affectedRows', label: 'Affected Rows', format: 'number' },
    { key: 'outParams', label: 'OUT Parameters', description: 'Final values of the OUT and INOUT parameters, keyed by parameter name.' },
  ],
};

export const mysqlGetServerInfoOutputSchema: OutputSchema = {
  fields: [
    { key: 'version', label: 'Version' },
    { key: 'versionComment', label: 'Version Comment' },
    { key: 'database', label: 'Database' },
    { key: 'currentUser', label: 'Current User' },
    { key: 'systemTimeZone', label: 'System Time Zone' },
    { key: 'timeZone', label: 'Time Zone' },
    { key: 'sqlMode', label: 'SQL Mode' },
    { key: 'readOnly', label: 'Read Only', format: 'boolean' },
  ],
};

export const mysqlListProcessesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'processes',
      label: 'Processes',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'user', label: 'User' },
        { key: 'host', label: 'Host' },
        { key: 'database', label: 'Database' },
        { key: 'command', label: 'Command' },
        { key: 'seconds', label: 'Seconds', format: 'number', description: 'Seconds in the current state.' },
        { key: 'state', label: 'State' },
        { key: 'statement', label: 'Statement' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};
