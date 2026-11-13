import { createAction, Property } from '@activepieces/pieces-framework';
import sql from 'mssql';
import { mssqlAuth } from '../../../auth';
import { MssqlTable, mssqlCommon } from '../../../common';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { microsoftSqlServerUpsertRowOutputSchema } from '../../../output-schemas';

export const upsertRow = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_upsert_row',
  outputSchema: microsoftSqlServerUpsertRowOutputSchema,
  displayName: 'Upsert Row',
  description: 'Inserts a row, or updates the existing row with the same key.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Inserts a row, or updates the row whose key columns already hold the same values (MERGE with HOLDLOCK). Key Columns default to the primary key and must cover a primary or unique key (see List Indexes); Values must give a non-null value for each of them. Update Columns limits which columns change on an existing row. Returns action (INSERT, UPDATE or unchanged) and the row as stored. Safe to retry.',
    idempotent: true,
  },
  props: {
    schema: mssqlAiProps.schema,
    table: mssqlAiProps.table,
    values: Property.Object({
      displayName: 'Values',
      description: 'Column names mapped to values, including the key columns, e.g. {"email": "ada@example.com", "name": "Ada"}.',
      required: true,
    }),
    keyColumns: Property.Array({
      displayName: 'Key Columns',
      description: 'Columns that identify the row, e.g. ["email"]. Leave empty to use the primary key.',
      required: false,
    }),
    updateColumns: Property.Array({
      displayName: 'Update Columns',
      description: 'Columns to overwrite when the row already exists. Leave empty to overwrite every non-key column in Values.',
      required: false,
    }),
  },
  async run(context) {
    const { schema, table } = context.propsValue;
    const values = mssqlAi.parseValues({ value: context.propsValue.values, label: 'Values' });
    const columns = Object.keys(values);
    return mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const target = await mssqlAi.resolveObject({ pool, schema, name: table, kinds: ['U'], label: 'Table' });
        const meta = await mssqlCommon.getTableMeta({ pool, table: target });
        const requestedKeys = (context.propsValue.keyColumns ?? []).map(String);
        const keys = requestedKeys.length > 0 ? requestedKeys : meta.keyColumns;
        await assertUniqueKey({ pool, target, keys });
        const missing = keys.filter((key) => values[key] === undefined || values[key] === null);
        if (missing.length > 0) {
          throw new Error(`Values must give a non-null value for every key column; missing: ${missing.join(', ')}.`);
        }
        const requestedUpdates = (context.propsValue.updateColumns ?? []).map(String);
        const updates = requestedUpdates.length > 0 ? requestedUpdates : columns.filter((column) => !keys.includes(column));
        const notInValues = updates.filter((column) => !columns.includes(column));
        if (notInValues.length > 0) {
          throw new Error(`Update Columns must also be in Values; missing: ${notInValues.join(', ')}.`);
        }
        const q = mssqlCommon.quoteId;
        const source = columns.map((column, index) => `@v${index} AS ${q(column)}`).join(', ');
        const on = keys.map((key) => `t.${q(key)} = s.${q(key)}`).join(' AND ');
        const matched = updates.length > 0 ? ` WHEN MATCHED THEN UPDATE SET ${updates.map((column) => `t.${q(column)} = s.${q(column)}`).join(', ')}` : '';
        const notMatched = ` WHEN NOT MATCHED THEN INSERT (${columns.map(q).join(', ')}) VALUES (${columns.map((column) => `s.${q(column)}`).join(', ')})`;
        const merge = `MERGE ${mssqlCommon.quoteTable(target)} WITH (HOLDLOCK) AS t USING (SELECT ${source}) AS s ON ${on}${matched}${notMatched}`;
        const params = Object.fromEntries(columns.map((column, index) => [`v${index}`, values[column]]));
        const result = await mssqlCommon.writeReturningRows({
          bind: () => mssqlAi.bind({ request: pool.request(), params }),
          withOutput: `${merge} OUTPUT $action AS ${q(ACTION_ALIAS)}, ${mssqlAi.projection({ columns: meta.columns, prefix: 'INSERTED' })};`,
          withoutOutput: `${merge};`,
        });
        const first = result.rows[0];
        if (first === undefined) {
          return { action: result.rows_affected === 0 ? 'unchanged' : null, row: null, rows_affected: result.rows_affected };
        }
        const { [ACTION_ALIAS]: action, ...row } = first;
        return { action, row, rows_affected: result.rows_affected };
      },
    });
  },
});

async function assertUniqueKey({ pool, target, keys }: { pool: sql.ConnectionPool; target: MssqlTable; keys: string[] }): Promise<void> {
  const result = await pool
    .request()
    .input('name', mssqlCommon.quoteTable(target))
    .query<Record<string, unknown>>(
      `SELECT i.name AS index_name, c.name AS column_name
       FROM sys.indexes i
       JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
       JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
       WHERE i.object_id = OBJECT_ID(@name) AND i.is_unique = 1 AND i.has_filter = 0 AND i.is_disabled = 0
       ORDER BY i.index_id, ic.key_ordinal`
    );
  const uniqueKeys = result.recordset.reduce<Record<string, string[]>>((acc, row) => {
    const indexName = String(row['index_name']);
    return { ...acc, [indexName]: [...(acc[indexName] ?? []), String(row['column_name'])] };
  }, {});
  const entries = Object.entries(uniqueKeys);
  if (entries.length === 0) {
    throw new Error(`Table "${target.table_schema}.${target.table_name}" has no primary or unique key, so an upsert cannot find an existing row. Use Insert Rows instead.`);
  }
  if (keys.length === 0 || !entries.some(([, columns]) => columns.every((column) => keys.includes(column)))) {
    const described = entries.map(([name, columns]) => `${name} (${columns.join(', ')})`).join('; ');
    throw new Error(`Key Columns must cover a primary or unique key: ${described}.`);
  }
}

const ACTION_ALIAS = '__ap_merge_action';
