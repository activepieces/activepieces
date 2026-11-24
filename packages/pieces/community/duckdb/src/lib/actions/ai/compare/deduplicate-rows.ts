import { createAction, Property } from '@activepieces/pieces-framework';
import { duckdbClient } from '../../../common/client';
import { duckdbDeduplicateRowsOutputSchema } from '../../../output-schemas';

export const duckdbDeduplicateRows = createAction({
  name: 'duckdb_deduplicate_rows',
  outputSchema: duckdbDeduplicateRowsOutputSchema,
  displayName: 'Deduplicate Rows',
  description:
    'Remove duplicate rows from a JSON array, matching on key columns or on the whole row.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Removes duplicates from a JSON array of row objects and returns the remaining rows unchanged, in their original order, plus how many were removed. Rows are duplicates when their key columns are equal, or when every value is equal if no key columns are given; keep chooses whether the first or last occurrence survives. Use before duckdb_compare_datasets when a key repeats.',
    idempotent: true,
  },
  props: {
    rows: Property.Json({
      displayName: 'Rows',
      description: 'A JSON array of row objects. May be empty.',
      required: true,
    }),
    key_columns: Property.Array({
      displayName: 'Key Columns',
      description:
        'Column names that identify a duplicate, e.g. ["email"]. Leave empty to treat only fully identical rows as duplicates.',
      required: false,
    }),
    keep: Property.StaticDropdown({
      displayName: 'Keep',
      description:
        'Which occurrence of each duplicate group to keep, by position in rows. Defaults to first.',
      required: false,
      defaultValue: 'first',
      options: {
        options: [
          { label: 'First', value: 'first' },
          { label: 'Last', value: 'last' },
        ],
      },
    }),
  },
  async run(context) {
    const rows = duckdbClient.parseRows({
      value: context.propsValue.rows,
      propName: 'rows',
      allowEmpty: true,
    });
    const keyColumns = duckdbClient.parseKeyColumns({
      value: context.propsValue.key_columns,
      propName: 'key_columns',
    });
    const keep = context.propsValue.keep ?? 'first';
    if (keep !== 'first' && keep !== 'last') {
      throw new Error('keep must be "first" or "last".');
    }
    if (rows.length === 0) {
      return { rows: [], removed_count: 0 };
    }
    return duckdbClient.withDatabase({
      run: async (connection) => {
        const structure = await duckdbClient.detectRowStructure({
          connection,
          rows,
        });
        await duckdbClient.loadIndexedRows({
          connection,
          name: 'data',
          rows,
          structure,
        });
        const partition =
          keyColumns.length > 0
            ? keyColumns
                .map((column) =>
                  duckdbClient.keyExpression({ alias: 't', column })
                )
                .join(', ')
            : 't.j';
        const direction = keep === 'first' ? 'ASC' : 'DESC';
        const kept = duckdbClient.readIndexes({
          reader: await connection.runAndReadAll(
            `SELECT t.i FROM data t QUALIFY row_number() OVER (PARTITION BY ${partition} ORDER BY t.i ${direction}) = 1 ORDER BY t.i`
          ),
        });
        return {
          rows: kept.map((i) => rows[i]),
          removed_count: rows.length - kept.length,
        };
      },
    });
  },
});
