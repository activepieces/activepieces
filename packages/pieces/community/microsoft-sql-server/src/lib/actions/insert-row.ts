import { createAction, Property } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../auth';
import { mssqlCommon } from '../common';
import { cursorUtils } from '../common/cursor';
import { mssqlProps } from '../common/props';
import { insertRowActionOutputSchema } from '../output-schemas';

export const insertRowAction = createAction({
  auth: mssqlAuth,
  name: 'insert_row',
  displayName: 'Insert Row',
  description: 'Inserts a new row into a table and returns it',
  audience: 'both',
  aiMetadata: {
    description:
      'Inserts one row into a SQL Server table from a map of column names to values, and returns the row as stored — including columns filled in by the database such as an IDENTITY id or a default timestamp. Use to add a record. Not idempotent: each call performs a fresh INSERT, so repeating it adds duplicate rows or fails on a unique-key collision.',
    idempotent: false,
  },
  props: {
    table: mssqlProps.table(),
    values: Property.Object({
      displayName: 'Values',
      description:
        'Column name to value. Omit columns that the database fills in, such as an identity id or a default timestamp.',
      required: true,
    }),
  },
  outputSchema: insertRowActionOutputSchema,
  async run(context) {
    const { table, values } = context.propsValue;
    const entries = Object.entries(values ?? {});
    if (entries.length === 0) {
      throw new Error('Provide at least one column and value to insert.');
    }

    const target = mssqlCommon.quoteTable(table);
    const columnList = entries
      .map(([column]) => mssqlCommon.quoteId(column))
      .join(', ');
    const placeholders = entries.map((_, i) => `@p${i}`).join(', ');
    const pool = await mssqlCommon.connect({ auth: context.auth });
    try {
      const meta = await mssqlCommon.getTableMeta({ pool, table });
      const query = `INSERT INTO ${target} (${columnList}) OUTPUT ${cursorUtils.exactProjection(
        { columns: meta.columns, prefix: 'INSERTED' }
      )} VALUES (${placeholders})`;
      const request = pool.request();
      entries.forEach(([, value], i) => request.input(`p${i}`, value ?? null));
      const result = await request.query<Record<string, unknown>>(query);
      return result.recordset?.[0] ?? {};
    } catch (e) {
      if (mssqlCommon.isOutputBlockedByTrigger(e)) {
        throw new Error(
          `${target} has enabled triggers, so SQL Server refuses to return the inserted row. Use the Run Query action with an "OUTPUT INSERTED.* INTO @table" clause instead.`
        );
      }
      throw e;
    } finally {
      await pool.close();
    }
  },
});
