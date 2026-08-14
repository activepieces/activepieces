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
