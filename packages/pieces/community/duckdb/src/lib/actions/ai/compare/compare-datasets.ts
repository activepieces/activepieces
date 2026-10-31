import { createAction, Property } from '@activepieces/pieces-framework';
import { DuckDBConnection } from '@duckdb/node-api';
import { duckdbClient } from '../../../common/client';
import { duckdbCompareDatasetsOutputSchema } from '../../../output-schemas';

export const duckdbCompareDatasets = createAction({
  name: 'duckdb_compare_datasets',
  outputSchema: duckdbCompareDatasetsOutputSchema,
  displayName: 'Compare Datasets',
  description:
    'Diff two JSON arrays of rows by key columns into added, removed and changed rows.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Matches rows of two JSON arrays (an older "before" and a newer "after" snapshot) on the key columns and returns rows only in after (added), rows only in before (removed), and matched rows whose other values differ (changed, with the changed column names). Use to find what changed between two exports or syncs without writing SQL. Fails if a key repeats within one side; run duckdb_deduplicate_rows on that side first.',
    idempotent: true,
  },
  props: {
    before: Property.Json({
      displayName: 'Before',
      description:
        'The older dataset: a JSON array of row objects. May be empty.',
      required: true,
    }),
    after: Property.Json({
      displayName: 'After',
      description:
        'The newer dataset: a JSON array of row objects. May be empty.',
      required: true,
    }),
    key_columns: Property.Array({
      displayName: 'Key Columns',
      description:
        'Column names that identify a row on both sides, e.g. ["id"] or ["order_id", "line"]. Values must be unique within each side.',
      required: true,
    }),
  },
  async run(context) {
    const before = duckdbClient.parseRows({
      value: context.propsValue.before,
      propName: 'before',
      allowEmpty: true,
    });
    const after = duckdbClient.parseRows({
      value: context.propsValue.after,
      propName: 'after',
      allowEmpty: true,
    });
    const keyColumns = duckdbClient.parseKeyColumns({
      value: context.propsValue.key_columns,
      propName: 'key_columns',
    });
    if (keyColumns.length === 0) {
      throw new Error('key_columns needs at least one column name.');
    }
    if (before.length === 0 && after.length === 0) {
      return { added: [], removed: [], changed: [], unchanged_count: 0 };
    }
    return duckdbClient.withDatabase({
      run: async (connection) => {
        const structure = await duckdbClient.detectRowStructure({
          connection,
          rows: [...before, ...after],
        });
        await duckdbClient.loadIndexedRows({
          connection,
          name: 'before_rows',
          rows: before,
          structure,
        });
        await duckdbClient.loadIndexedRows({
          connection,
          name: 'after_rows',
          rows: after,
          structure,
        });
        await assertUniqueKeys({ connection, table: 'before_rows', side: 'before', keyColumns });
        await assertUniqueKeys({ connection, table: 'after_rows', side: 'after', keyColumns });

        const match = keyColumns
          .map(
            (column) =>
              `${duckdbClient.keyExpression({ alias: 'b', column })} IS NOT DISTINCT FROM ${duckdbClient.keyExpression({ alias: 'a', column })}`
          )
          .join(' AND ');

        const addedIndexes = duckdbClient.readIndexes({
          reader: await connection.runAndReadAll(
            `SELECT a.i FROM after_rows a WHERE NOT EXISTS (SELECT 1 FROM before_rows b WHERE ${match}) ORDER BY a.i`
          ),
        });
        const removedIndexes = duckdbClient.readIndexes({
          reader: await connection.runAndReadAll(
            `SELECT b.i FROM before_rows b WHERE NOT EXISTS (SELECT 1 FROM after_rows a WHERE ${match}) ORDER BY b.i`
          ),
        });
        const pairs = (
          await connection.runAndReadAll(
            `SELECT b.i, a.i, b.r IS DISTINCT FROM a.r FROM before_rows b JOIN after_rows a ON ${match} ORDER BY a.i`
          )
        ).getRows();

        const changed = pairs
          .filter((pair) => pair[2] === true)
          .map((pair) => {
            const beforeRow = before[Number(pair[0])];
            const afterRow = after[Number(pair[1])];
            return {
              key: Object.fromEntries(
                keyColumns.map((column) => [column, afterRow[column] ?? null])
              ),
              changed_columns: changedColumns({ beforeRow, afterRow }),
              before: beforeRow,
              after: afterRow,
            };
          });

        return {
          added: addedIndexes.map((i) => after[i]),
          removed: removedIndexes.map((i) => before[i]),
          changed,
          unchanged_count: pairs.length - changed.length,
        };
      },
    });
  },
});

async function assertUniqueKeys({
  connection,
  table,
  side,
  keyColumns,
}: {
  connection: DuckDBConnection;
  table: string;
  side: string;
  keyColumns: string[];
}): Promise<void> {
  const keys = keyColumns
    .map((column) => duckdbClient.keyExpression({ alias: 't', column }))
    .join(', ');
  const reader = await connection.runAndReadAll(
    `SELECT min(t.i) FROM ${table} t GROUP BY ${keys} HAVING count(*) > 1 LIMIT 1`
  );
  const duplicate = duckdbClient.readIndexes({ reader });
  if (duplicate.length > 0) {
    throw new Error(
      `${side} has more than one row with the key of ${side}[${duplicate[0]}]; key_columns must be unique within each side.`
    );
  }
}

function changedColumns({
  beforeRow,
  afterRow,
}: {
  beforeRow: Record<string, unknown>;
  afterRow: Record<string, unknown>;
}): string[] {
  const columns = [...new Set([...Object.keys(beforeRow), ...Object.keys(afterRow)])];
  return columns.filter(
    (column) =>
      canonicalJson({ value: beforeRow[column] ?? null }) !==
      canonicalJson({ value: afterRow[column] ?? null })
  );
}

function canonicalJson({ value }: { value: unknown }): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson({ value: item })).join(',')}]`;
  }
  if (duckdbClient.isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson({ value: value[key] })}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}
