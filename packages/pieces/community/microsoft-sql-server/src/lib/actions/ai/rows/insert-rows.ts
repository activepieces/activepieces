import { createAction, Property } from '@activepieces/pieces-framework';
import sql from 'mssql';
import { mssqlAuth } from '../../../auth';
import { mssqlCommon } from '../../../common';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { insertRowsUtils } from '../../insert-rows';
import { writeRowsActionOutputSchema } from '../../../output-schemas';

export const insertRowsAi = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_insert_rows',
  outputSchema: writeRowsActionOutputSchema,
  displayName: 'Insert Rows',
  description: 'Inserts a list of rows into a table in one transaction and returns them.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Inserts a list of rows, each an object of column names to values, in one transaction: if any row fails, none are inserted. Columns a row omits get the column default; objects and arrays are stored as JSON text. Returns the inserted rows as stored, with IDENTITY ids and defaults (empty when the table has triggers; rows_affected is always set). Use Upsert Row to insert-or-update by key. Not idempotent: repeating it inserts the rows again.',
    idempotent: false,
  },
  props: {
    schema: mssqlAiProps.schema,
    table: mssqlAiProps.table,
    rows: Property.Json({
      displayName: 'Rows',
      description: 'A list of objects, one per row, e.g. [{"name": "Ada", "age": 36}]. Column names come from Describe Table.',
      required: true,
    }),
  },
  async run(context) {
    const { schema, table, rows } = context.propsValue;
    const records = insertRowsUtils.toRecords({ rows, keepEmptyStrings: true });
    const columns = insertRowsUtils.collectColumns({ records });
    return mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const target = await mssqlAi.resolveObject({ pool, schema, name: table, kinds: mssqlAi.TABLE_KINDS, label: 'Table' });
        const meta = await mssqlCommon.getTableMeta({ pool, table: target });
        const quotedTable = mssqlCommon.quoteTable(target);
        const insert = (output: string) =>
          insertAll({ pool, statements: insertRowsUtils.buildStatements({ quotedTable, columns, records, output }) });
        const results = await insert(`OUTPUT ${mssqlAi.projection({ columns: meta.columns, prefix: 'INSERTED' })}`).catch(
          (error: unknown) => {
            if (!mssqlCommon.isOutputBlockedByTrigger(error)) {
              throw error;
            }
            return insert('');
          },
        );
        return {
          rows: results.flatMap((result) => result.recordset ?? []),
          rows_affected: results.reduce((total, result) => total + (result.rowsAffected ?? []).reduce((a, b) => a + b, 0), 0),
        };
      },
    });
  },
});

function insertAll({
  pool,
  statements,
}: {
  pool: sql.ConnectionPool;
  statements: { text: string; values: unknown[] }[];
}): Promise<sql.IResult<Record<string, unknown>>[]> {
  return mssqlAi.withTransaction({
    pool,
    fn: async (transaction) => {
      const results: sql.IResult<Record<string, unknown>>[] = [];
      for (const statement of statements) {
        const params = Object.fromEntries(statement.values.map((value, index) => [`p${index}`, value]));
        results.push(await mssqlAi.bind({ request: transaction.request(), params }).query<Record<string, unknown>>(statement.text));
      }
      return results;
    },
  });
}
