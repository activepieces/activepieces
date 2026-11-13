import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const columnFields: OutputSchemaField[] = [
  { key: 'name', label: 'Column Name' },
  { key: 'type', label: 'DuckDB Type' },
];

export const duckdbRunQueryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Rows',
      description:
        'One object per result row, keyed by the column names the query selected.',
    },
    { key: 'row_count', label: 'Row Count', format: 'number' },
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'name',
      listItems: columnFields,
    },
  ],
};

export const duckdbDescribeDataOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'name',
      listItems: columnFields,
    },
    { key: 'row_count', label: 'Row Count', format: 'number' },
  ],
};

export const duckdbSummarizeDataOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'columns',
      label: 'Column Statistics',
      labelKey: 'column_name',
      listItems: [
        { key: 'column_name', label: 'Column Name' },
        { key: 'column_type', label: 'DuckDB Type' },
        { key: 'min', label: 'Minimum' },
        { key: 'max', label: 'Maximum' },
        { key: 'approx_unique', label: 'Approximate Distinct Values', format: 'number' },
        { key: 'avg', label: 'Average' },
        { key: 'std', label: 'Standard Deviation' },
        { key: 'q25', label: '25th Percentile' },
        { key: 'q50', label: 'Median' },
        { key: 'q75', label: '75th Percentile' },
        { key: 'count', label: 'Value Count', format: 'number' },
        { key: 'null_percentage', label: 'Null Percentage' },
      ],
    },
    { key: 'row_count', label: 'Row Count', format: 'number' },
  ],
};

export const duckdbCompareDatasetsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'added',
      label: 'Added Rows',
      description: 'Rows from after whose key is not in before, as given.',
    },
    {
      key: 'removed',
      label: 'Removed Rows',
      description: 'Rows from before whose key is not in after, as given.',
    },
    {
      key: 'changed',
      label: 'Changed Rows',
      listItems: [
        {
          key: 'key',
          label: 'Key',
          description: 'The key column values of the matched row.',
        },
        { key: 'changed_columns', label: 'Changed Columns' },
        { key: 'before', label: 'Before', description: 'The row as it was in before.' },
        { key: 'after', label: 'After', description: 'The row as it is in after.' },
      ],
    },
    { key: 'unchanged_count', label: 'Unchanged Rows', format: 'number' },
  ],
};

export const duckdbDeduplicateRowsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Rows',
      description: 'The rows that remain, unchanged and in their original order.',
    },
    { key: 'removed_count', label: 'Removed Rows', format: 'number' },
  ],
};
