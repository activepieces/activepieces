import { createAction, Property } from '@activepieces/pieces-framework';
import { Connection } from 'promise-mysql';
import { mysqlAuth } from '../../../..';
import { mysqlAi, mysqlAiProps, MysqlOkPacket } from '../../../common/ai';
import { sanitizeColumnName } from '../../../common';
import { mysqlUpsertRowOutputSchema } from '../../../output-schemas';

export const upsertRow = createAction({
  auth: mysqlAuth,
  name: 'mysql_upsert_row',
  outputSchema: mysqlUpsertRowOutputSchema,
  displayName: 'Upsert Row',
  description: 'Inserts a row, or updates the existing row with the same primary or unique key.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Inserts a row, or updates the row that already has the same primary or unique key (INSERT ... ON DUPLICATE KEY UPDATE). Values must give a non-null value for every column of at least one primary or unique key (see List Indexes); it fails otherwise. Update Columns limits which columns change on an existing row. affectedRows is 1 for an insert and 2 for an update. Safe to retry.',
    idempotent: true,
  },
  props: {
    table: mysqlAiProps.table,
    values: Property.Object({
      displayName: 'Values',
      description: 'Column names mapped to values, including the key columns, e.g. {"email": "ada@example.com", "name": "Ada"}.',
      required: true,
    }),
    updateColumns: Property.Array({
      displayName: 'Update Columns',
      description: 'Columns to overwrite when the row already exists. Leave empty to overwrite every column in Values.',
      required: false,
    }),
  },
  async run(context) {
    const { table, updateColumns } = context.propsValue;
    const values = mysqlAi.parseValues({ value: context.propsValue.values, label: 'Values' });
    const columns = Object.keys(values);
    const toUpdate = (updateColumns ?? []).length > 0 ? (updateColumns ?? []).map((column) => String(column)) : columns;
    const missing = toUpdate.filter((column) => !hasColumn({ columns, column }));
    if (missing.length > 0) {
      throw new Error(`Update Columns must also be in Values; missing: ${missing.join(', ')}.`);
    }
    const quotedColumns = columns.map((column) => sanitizeColumnName(column));
    const updates = toUpdate.map((column) => `${sanitizeColumnName(column)} = VALUES(${sanitizeColumnName(column)})`);
    const sql = `INSERT INTO ${sanitizeColumnName(table)} (${quotedColumns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')}) ON DUPLICATE KEY UPDATE ${updates.join(', ')}`;
    const result: MysqlOkPacket = await mysqlAi.withConnection({
      auth: context.auth,
      fn: async (conn) => {
        await assertKeyCovered({ conn, table, values });
        return conn.query(sql, columns.map((column) => mysqlAi.toBindValue({ value: values[column] })));
      },
    });
    return { affectedRows: result.affectedRows, insertId: result.insertId };
  },
});

async function assertKeyCovered({ conn, table, values }: { conn: Connection; table: string; values: Record<string, unknown> }): Promise<void> {
  const { schema, name } = mysqlAi.splitTable({ table });
  const identifying = Object.keys(values).filter((column) => values[column] !== null && values[column] !== undefined);
  const rows: Record<string, unknown>[] = await conn.query(
    'SELECT index_name AS indexName, column_name AS columnName FROM information_schema.statistics WHERE table_schema = COALESCE(?, DATABASE()) AND table_name = ? AND non_unique = 0',
    [schema, name],
  );
  const keys = rows.reduce<Record<string, string[]>>((acc, row) => {
    const indexName = String(row['indexName']);
    return { ...acc, [indexName]: [...(acc[indexName] ?? []), String(row['columnName'])] };
  }, {});
  const keyList = Object.entries(keys);
  if (keyList.length === 0) {
    throw new Error(`Table "${table}" has no primary or unique key, so an upsert would always insert. Use Insert Rows instead.`);
  }
  const covered = keyList.some(([, keyColumns]) => keyColumns.every((column) => hasColumn({ columns: identifying, column })));
  if (!covered) {
    const described = keyList.map(([indexName, keyColumns]) => `${indexName} (${keyColumns.join(', ')})`).join('; ');
    throw new Error(`Values must give a non-null value for every column of a primary or unique key: ${described}.`);
  }
}

function hasColumn({ columns, column }: { columns: string[]; column: string }): boolean {
  return columns.some((candidate) => candidate.toLowerCase() === column.toLowerCase());
}
