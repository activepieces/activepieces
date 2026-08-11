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
