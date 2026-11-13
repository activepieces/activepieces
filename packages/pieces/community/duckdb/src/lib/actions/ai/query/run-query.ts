import { createAction, Property } from '@activepieces/pieces-framework';
import { DuckDBValue } from '@duckdb/node-api';
import { duckdbClient } from '../../../common/client';
import { duckdbRunQueryOutputSchema } from '../../../output-schemas';

export const duckdbRunQuery = createAction({
  name: 'duckdb_run_query',
  outputSchema: duckdbRunQueryOutputSchema,
  displayName: 'Run SQL Query',
  description:
    'Load JSON rows as tables in a temporary in-memory DuckDB and run one SQL query over them.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Runs one SQL statement (DuckDB dialect) over JSON data you already have, loaded as named tables in a throwaway in-memory database with no file or network access. Use for joins, filters, aggregations, window functions and reshaping across one or more datasets; use duckdb_compare_datasets or duckdb_deduplicate_rows instead when you only need a diff or de-duplication. Pass user-supplied values as $1, $2, … in params rather than inside the SQL.',
    idempotent: true,
  },
  props: {
    tables: Property.Json({
      displayName: 'Tables',
      description:
        'A JSON object mapping each table name to its rows, e.g. {"orders": [{"id": 1, "total": 9.5}], "customers": [{"id": 1, "name": "Ann"}]}. Columns come from the row keys and types are detected from the values; a nested object stays one STRUCT column, queried with dot notation (meta.city). Each table needs at least one row.',
      required: true,
    }),
    query: Property.LongText({
      displayName: 'SQL Query',
      description:
        'One DuckDB SQL statement over the tables above, e.g. SELECT c.name, sum(o.total) AS spent FROM orders o JOIN customers c ON c.id = o.customer_id GROUP BY ALL. Quote table or column names that are not plain identifiers with double quotes.',
      required: true,
    }),
    params: Property.Json({
      displayName: 'Parameters',
      description:
        'A JSON array of values bound to $1, $2, … in the query, in order, e.g. ["IN", 10, null]. Strings, numbers, booleans or null.',
      required: false,
    }),
  },
  async run(context) {
    const { tables, query, params } = context.propsValue;
    if (!duckdbClient.isPlainObject(tables) || Object.keys(tables).length === 0) {
      throw new Error(
        'tables must be a JSON object mapping each table name to an array of row objects.'
      );
    }
    const values = parseParams({ params });
    return duckdbClient.withDatabase({
      run: async (connection) => {
        for (const [name, value] of Object.entries(tables)) {
          const rows = duckdbClient.parseRows({
            value,
            propName: `tables.${name}`,
          });
          await duckdbClient.loadTable({ connection, name, rows });
        }
        const reader = await connection.runAndReadAll(query, values);
        const rows = duckdbClient.readRows({ reader });
        return {
          rows,
          row_count: rows.length,
          columns: duckdbClient.readColumns({ reader }),
        };
      },
    });
  },
});

function parseParams({ params }: { params: unknown }): DuckDBValue[] {
  if (
    params === undefined ||
    params === null ||
    (duckdbClient.isPlainObject(params) && Object.keys(params).length === 0)
  ) {
    return [];
  }
  if (!Array.isArray(params)) {
    throw new Error('params must be a JSON array of values.');
  }
  const badIndex = params.findIndex((param) => !isScalar(param));
  if (badIndex !== -1) {
    throw new Error(
      `params[${badIndex}] must be a string, number, boolean or null.`
    );
  }
  return params.filter(isScalar);
}

function isScalar(value: unknown): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}
