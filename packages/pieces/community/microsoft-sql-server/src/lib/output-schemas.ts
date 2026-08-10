import { OutputSchema } from '@activepieces/pieces-framework';

// row fields are named but left undescribed on purpose: describing a container
// curates it, which would hide whichever columns the user's table actually has

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
      key: 'row_count',
      label: 'Row Count',
      format: 'number',
      description: 'How many rows were returned.',
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
