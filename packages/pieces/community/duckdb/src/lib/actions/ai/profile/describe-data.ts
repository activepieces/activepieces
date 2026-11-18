import { createAction, Property } from '@activepieces/pieces-framework';
import { duckdbClient } from '../../../common/client';
import { duckdbDescribeDataOutputSchema } from '../../../output-schemas';

export const duckdbDescribeData = createAction({
  name: 'duckdb_describe_data',
  outputSchema: duckdbDescribeDataOutputSchema,
  displayName: 'Describe Data',
  description:
    'Detect the columns and DuckDB types of a JSON array of rows.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Loads a JSON array of row objects into a throwaway in-memory DuckDB and returns each column with the type DuckDB detected, plus the row count. Use before writing SQL for duckdb_run_query to learn column names and types; use duckdb_summarize_data when you also need per-column statistics.',
    idempotent: true,
  },
  props: {
    rows: Property.Json({
      displayName: 'Rows',
      description:
        'A JSON array of row objects, e.g. [{"id": 1, "email": "a@b.co"}]. At least one row.',
      required: true,
    }),
  },
  async run(context) {
    const rows = duckdbClient.parseRows({
      value: context.propsValue.rows,
      propName: 'rows',
    });
    return duckdbClient.withDatabase({
      run: async (connection) => {
        await duckdbClient.loadTable({ connection, name: 'data', rows });
        const reader = await connection.runAndReadAll('DESCRIBE data');
        return {
          columns: duckdbClient.readRows({ reader }).map((column) => ({
            name: column['column_name'],
            type: column['column_type'],
          })),
          row_count: rows.length,
        };
      },
    });
  },
});
