import { OutputSchema } from '@activepieces/pieces-framework';

export const getTablesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tables',
      label: 'Tables',
      labelKey: 'table_name',
      description: 'Base tables in the connected database.',
      listItems: [
        { key: 'table_schema', label: 'Schema' },
        { key: 'table_name', label: 'Table' },
      ],
    },
  ],
};

export const insertRowOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'row',
      label: 'Inserted Row',
      description: 'The inserted row as stored by the database, including defaults and generated ids. Its fields are the columns of the target table. Null when Return Inserted Row is disabled.',
    },
    { key: 'rowCount', label: 'Inserted Rows', format: 'number' },
  ],
};

export const insertRowsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Inserted Rows',
      description: 'The inserted rows as stored by the database, including defaults and generated ids; each row\'s fields are the columns of the target table. Only present when Return Inserted Rows is enabled.',
    },
    { key: 'rowCount', label: 'Inserted Row Count', format: 'number' },
  ],
};

export const updateRowOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Updated Rows',
      description: 'The rows after the update; each row\'s fields are the columns of the target table. Empty unless Return Updated Rows is enabled.',
    },
    { key: 'rowCount', label: 'Updated Row Count', format: 'number' },
  ],
};

export const deleteRowOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Deleted Rows',
      description: 'The rows as they were just before deletion; each row\'s fields are the columns of the target table. Empty unless Return Deleted Rows is enabled.',
    },
    { key: 'rowCount', label: 'Deleted Row Count', format: 'number' },
  ],
};

export const findRowsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Rows',
      description: 'Rows matching the condition; each row\'s fields are the columns of the queried table.',
    },
    { key: 'rowCount', label: 'Row Count', format: 'number' },
  ],
};

export const postgresListSchemasOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'schemas',
      label: 'Schemas',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Schema' },
        { key: 'owner', label: 'Owner' },
        { key: 'current', label: 'Default Schema', format: 'boolean', description: 'True for the schema unqualified table names resolve to.' },
      ],
    },
    { key: 'count', label: 'Schema Count', format: 'number' },
  ],
};

export const postgresDescribeTableOutputSchema: OutputSchema = {
  fields: [
    { key: 'schema', label: 'Schema' },
    { key: 'table', label: 'Table' },
    { key: 'primaryKey', label: 'Primary Key Columns' },
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Column' },
        { key: 'type', label: 'Type' },
        { key: 'nullable', label: 'Nullable', format: 'boolean' },
        { key: 'defaultValue', label: 'Default' },
        { key: 'isIdentity', label: 'Identity', format: 'boolean' },
        { key: 'isGenerated', label: 'Generated', format: 'boolean' },
        { key: 'comment', label: 'Comment' },
        { key: 'isPrimaryKey', label: 'Primary Key', format: 'boolean' },
        { key: 'references', label: 'References', description: 'The schema.table.column this column points to through a foreign key, or null.' },
      ],
    },
    { key: 'count', label: 'Column Count', format: 'number' },
  ],
};

export const postgresListIndexesOutputSchema: OutputSchema = {
  fields: [
    { key: 'schema', label: 'Schema' },
    { key: 'table', label: 'Table' },
    {
      key: 'indexes',
      label: 'Indexes',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Index' },
        { key: 'columns', label: 'Key Columns' },
        { key: 'method', label: 'Method' },
        { key: 'isUnique', label: 'Unique', format: 'boolean' },
        { key: 'isPrimary', label: 'Primary Key', format: 'boolean' },
        { key: 'definition', label: 'Definition' },
      ],
    },
    { key: 'count', label: 'Index Count', format: 'number' },
  ],
};

export const postgresListViewsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'views',
      label: 'Views',
      labelKey: 'name',
      listItems: [
        { key: 'schema', label: 'Schema' },
        { key: 'name', label: 'View' },
        { key: 'isMaterialized', label: 'Materialized', format: 'boolean' },
        { key: 'owner', label: 'Owner' },
      ],
    },
    { key: 'count', label: 'View Count', format: 'number' },
  ],
};

export const postgresGetViewDefinitionOutputSchema: OutputSchema = {
  fields: [
    { key: 'schema', label: 'Schema' },
    { key: 'name', label: 'View' },
    { key: 'isMaterialized', label: 'Materialized', format: 'boolean' },
    { key: 'definition', label: 'Definition', description: 'The SELECT statement behind the view.' },
  ],
};

export const postgresListRoutinesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'routines',
      label: 'Routines',
      labelKey: 'name',
      listItems: [
        { key: 'schema', label: 'Schema' },
        { key: 'name', label: 'Routine' },
        { key: 'kind', label: 'Kind', description: 'function or procedure.' },
        { key: 'arguments', label: 'Arguments' },
        { key: 'returns', label: 'Returns', description: 'The return type; null for a procedure.' },
        { key: 'language', label: 'Language' },
      ],
    },
    { key: 'count', label: 'Routine Count', format: 'number' },
  ],
};

export const postgresFindRowsOutputSchema: OutputSchema = {
  fields: [
    tableRows({ description: 'Rows matching the filters; each row\'s fields are the columns of the queried table.' }),
    { key: 'count', label: 'Row Count', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
    { key: 'nextOffset', label: 'Next Offset', format: 'number', description: 'Offset for the next page; null when there are no more rows.' },
  ],
};

export const postgresGetRowByKeyOutputSchema: OutputSchema = {
  fields: [
    { key: 'row', label: 'Row', description: 'The matching row; its fields are the columns of the table.' },
  ],
};

export const postgresCountRowsOutputSchema: OutputSchema = {
  fields: [{ key: 'count', label: 'Row Count', format: 'number' }],
};

export const postgresInsertRowsOutputSchema: OutputSchema = {
  fields: [
    tableRows({ description: 'The inserted rows as stored, with generated ids and defaults; each row\'s fields are the columns of the table.' }),
    { key: 'rowCount', label: 'Inserted Row Count', format: 'number' },
  ],
};

export const postgresUpsertRowOutputSchema: OutputSchema = {
  fields: [
    { key: 'row', label: 'Row', description: 'The row as stored after the insert or update; its fields are the columns of the table.' },
    { key: 'inserted', label: 'Inserted', format: 'boolean', description: 'True when a new row was inserted, false when an existing row was updated.' },
  ],
};

export const postgresUpdateRowsOutputSchema: OutputSchema = {
  fields: [
    tableRows({ description: 'The rows after the update; each row\'s fields are the columns of the table.' }),
    { key: 'rowCount', label: 'Updated Row Count', format: 'number' },
  ],
};

export const postgresDeleteRowsOutputSchema: OutputSchema = {
  fields: [
    tableRows({ description: 'The rows as they were just before deletion; each row\'s fields are the columns of the table.' }),
    { key: 'rowCount', label: 'Deleted Row Count', format: 'number' },
  ],
};

export const postgresRunSelectQueryOutputSchema: OutputSchema = {
  fields: [
    tableRows({ description: 'Rows returned by the query; each row\'s fields are the columns it selects.' }),
    { key: 'count', label: 'Row Count', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean', description: 'True when the query returned more rows than Limit.' },
  ],
};

export const postgresExplainQueryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'plan',
      label: 'Plan',
      children: [
        {
          key: 'Plan',
          label: 'Root Node',
          children: [
            { key: 'Node Type', label: 'Node Type' },
            { key: 'Relation Name', label: 'Table' },
            { key: 'Startup Cost', label: 'Startup Cost', format: 'number' },
            { key: 'Total Cost', label: 'Total Cost', format: 'number' },
            { key: 'Plan Rows', label: 'Estimated Rows', format: 'number' },
            { key: 'Plan Width', label: 'Estimated Row Width', format: 'number' },
            {
              key: 'Plans',
              label: 'Child Nodes',
              description: 'Nested plan nodes, each shaped like the root node.',
              listItems: [
                { key: 'Node Type', label: 'Node Type' },
                { key: 'Index Name', label: 'Index' },
                { key: 'Relation Name', label: 'Table' },
                { key: 'Total Cost', label: 'Total Cost', format: 'number' },
                { key: 'Plan Rows', label: 'Estimated Rows', format: 'number' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const postgresCallRoutineOutputSchema: OutputSchema = {
  fields: [
    { key: 'kind', label: 'Kind', description: 'function or procedure.' },
    {
      key: 'rows',
      label: 'Result Rows',
      description: 'A function\'s result rows, or one row of a procedure\'s INOUT and OUT values; field names come from the routine.',
    },
    { key: 'rowCount', label: 'Row Count', format: 'number' },
  ],
};

export const postgresGetServerInfoOutputSchema: OutputSchema = {
  fields: [
    { key: 'version', label: 'Version' },
    { key: 'serverVersion', label: 'Server Version' },
    { key: 'serverVersionNum', label: 'Server Version Number', format: 'number' },
    { key: 'database', label: 'Database' },
    { key: 'user', label: 'User' },
    { key: 'timeZone', label: 'Time Zone' },
    { key: 'searchPath', label: 'Search Path' },
    { key: 'encoding', label: 'Encoding' },
    { key: 'isReplica', label: 'Read Replica', format: 'boolean' },
  ],
};

export const postgresListActivityOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'sessions',
      label: 'Sessions',
      labelKey: 'pid',
      listItems: [
        { key: 'pid', label: 'Process ID', format: 'number' },
        { key: 'user', label: 'User' },
        { key: 'application', label: 'Application' },
        { key: 'clientAddress', label: 'Client Address' },
        { key: 'state', label: 'State' },
        { key: 'query', label: 'Query' },
        { key: 'backendStart', label: 'Connected At', format: 'datetime' },
        { key: 'transactionStart', label: 'Transaction Started At', format: 'datetime' },
        { key: 'queryStart', label: 'Query Started At', format: 'datetime' },
        { key: 'stateChange', label: 'State Changed At', format: 'datetime' },
        { key: 'waitEventType', label: 'Wait Event Type' },
        { key: 'waitEvent', label: 'Wait Event' },
        { key: 'isCurrentSession', label: 'This Session', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Session Count', format: 'number' },
  ],
};

function tableRows({ description }: { description: string }): OutputSchema['fields'][number] {
  return { key: 'rows', label: 'Rows', description };
}
