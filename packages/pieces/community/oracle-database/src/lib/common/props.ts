import { Property } from '@activepieces/pieces-framework';
import { OracleDbClient } from './client';
import { OracleDbAuth } from './types';

export const oracleDbProps = {
  tableName: () =>
    Property.Dropdown({
      displayName: 'Table Name',
      required: true,
      refreshers: [],
      options: async (propsValue) => {
        const auth = propsValue['auth'] as OracleDbAuth | undefined;

        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }
        const client = new OracleDbClient(auth);
        const tables = await client.getTables();
        return {
          disabled: false,
          options: tables.map((table) => ({
            label: table.label,
            value: table.value,
          })),
        };
      },
    }),

  row: () =>
    Property.Json({
      displayName: 'Row',
      description:
        'The row object to insert, with keys as column names and values as the data.',
      required: true,
      defaultValue: {
        COLUMN_NAME: 'value',
      },
    }),

  rows: () =>
    Property.Json({
      displayName: 'Rows',
      description:
        'An array of row objects to insert. All objects must have the same keys (column names).',
      required: true,
      defaultValue: [
        { COLUMN_1: 'value_a', COLUMN_2: 1 },
        { COLUMN_1: 'value_b', COLUMN_2: 2 },
      ],
    }),

  sql: () =>
    Property.LongText({
      displayName: 'SQL Query',
      description:
        "The SQL query or PL/SQL block to execute. Use bind variables for security (e.g., :id). Do not include a trailing semicolon ';'.",
      required: true,
      defaultValue: 'SELECT * FROM employees WHERE department_id = :dept_id',
    }),

  binds: () =>
    Property.Json({
      displayName: 'Bind Parameters',
      description:
        'An optional key-value object for bind variables used in your SQL query.',
      required: false,
      defaultValue: { dept_id: 90 },
    }),

  values: () =>
    Property.Json({
      displayName: 'Values to Update',
      description:
        'A key-value object where keys are the column names to update and values are the new data.',
      required: true,
      defaultValue: { SALARY: 8000 },
    }),

  filter: () =>
    Property.Json({
      displayName: 'Filter Conditions (WHERE)',
      description:
        'A key-value object to build the WHERE clause. Multiple conditions are joined by AND. **Important: An empty object will match ALL rows.**',
      required: true,
      defaultValue: { ID: 101 },
    }),

  orderBy: () =>
    Property.Dropdown({
      displayName: 'Order By Column',
      description:
        'Select a column that consistently increases over time, like an ID or a CREATED_AT timestamp.',
      required: true,
      refreshers: ['tableName'],
      options: async (propsValue) => {
        const tableName = propsValue['tableName'] as string | undefined;
        const auth = propsValue['auth'] as OracleDbAuth | undefined;

        if (!auth || !tableName) {
          return {
            disabled: true,
            placeholder: 'Please select a table first',
            options: [],
          };
        }
        const client = new OracleDbClient(auth);
        const columns = await client.getColumns(tableName);
        return {
          disabled: false,
          options: columns.map((col: { label: string; value: string }) => ({
            label: col.label,
            value: col.value,
          })),
        };
      },
    }),
};
