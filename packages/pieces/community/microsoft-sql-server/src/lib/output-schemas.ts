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
