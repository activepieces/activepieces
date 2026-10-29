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

const statementIdField: OutputSchemaField = {
  key: 'statementId',
  label: 'Statement ID',
};

const affectedRowsField: OutputSchemaField = {
  key: 'num_affected_rows',
  label: 'Rows Affected',
  format: 'number',
};

const insertedRowsField: OutputSchemaField = {
  key: 'num_inserted_rows',
  label: 'Rows Inserted',
  format: 'number',
};

export const queryResultOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Rows',
      description: 'Each row is an object keyed by column name.',
      listItems: [rowColumnsField],
    },
    { key: 'columns', label: 'Column Names' },
    { key: 'rowCount', label: 'Rows Returned', format: 'number' },
    { key: 'truncated', label: 'Truncated', format: 'boolean' },
    statementIdField,
  ],
};

export const insertResultOutputSchema: OutputSchema = {
  fields: [affectedRowsField, insertedRowsField, statementIdField],
};

export const updateResultOutputSchema: OutputSchema = {
  fields: [affectedRowsField, statementIdField],
};

export const upsertResultOutputSchema: OutputSchema = {
  fields: [
    affectedRowsField,
    insertedRowsField,
    { key: 'num_updated_rows', label: 'Rows Updated', format: 'number' },
    statementIdField,
  ],
};

export const loadFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'filePath', label: 'Volume File Path' },
    affectedRowsField,
    insertedRowsField,
    {
      key: 'num_skipped_corrupt_files',
      label: 'Corrupt Files Skipped',
      format: 'number',
    },
    statementIdField,
  ],
};

export const askGenieOutputSchema: OutputSchema = {
  fields: [
    { key: 'answer', label: 'Answer' },
    { key: 'sql', label: 'Generated SQL' },
    { key: 'queryDescription', label: 'Query Description' },
    {
      key: 'rows',
      label: 'Rows',
      description:
        'Rows returned by the query Genie ran, keyed by column name.',
      listItems: [rowColumnsField],
    },
    { key: 'columns', label: 'Column Names' },
    { key: 'rowCount', label: 'Rows Returned', format: 'number' },
    { key: 'truncated', label: 'Truncated', format: 'boolean' },
    { key: 'conversationId', label: 'Conversation ID' },
    { key: 'messageId', label: 'Message ID' },
    { key: 'status', label: 'Status' },
  ],
};
