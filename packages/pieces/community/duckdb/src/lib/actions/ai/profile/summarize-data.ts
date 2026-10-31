import { createAction, Property } from '@activepieces/pieces-framework';
import { duckdbClient } from '../../../common/client';
import { duckdbSummarizeDataOutputSchema } from '../../../output-schemas';

export const duckdbSummarizeData = createAction({
  name: 'duckdb_summarize_data',
  outputSchema: duckdbSummarizeDataOutputSchema,
  displayName: 'Summarize Data',
  description:
    'Per-column statistics (min, max, distinct count, average, quartiles, null %) for a JSON array of rows.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Runs DuckDB SUMMARIZE over a JSON array of row objects and returns, for every column, its type, min, max, approximate distinct count, average, standard deviation, 25/50/75th percentiles, value count and null percentage. Use to profile or sanity-check a dataset; use duckdb_describe_data when column names and types are enough.',
    idempotent: true,
  },
  props: {
    rows: Property.Json({
      displayName: 'Rows',
      description:
        'A JSON array of row objects, e.g. [{"id": 1, "amount": 12.5}]. At least one row.',
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
        const reader = await connection.runAndReadAll('SUMMARIZE data');
        return {
          columns: duckdbClient.readRows({ reader }),
          row_count: rows.length,
        };
      },
    });
  },
});
