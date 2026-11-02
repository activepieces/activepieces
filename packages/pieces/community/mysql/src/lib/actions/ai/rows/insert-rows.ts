import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi, mysqlAiProps, MysqlOkPacket } from '../../../common/ai';
import { sanitizeColumnName } from '../../../common';
import { insertRowsUtils } from '../../insert-rows';
import { mysqlInsertRowsOutputSchema } from '../../../output-schemas';

export const insertRowsAi = createAction({
  auth: mysqlAuth,
  name: 'mysql_insert_rows',
  outputSchema: mysqlInsertRowsOutputSchema,
  displayName: 'Insert Rows',
  description: 'Inserts a list of rows into a table in one transaction.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Inserts a list of rows, each an object of column names to values, in one transaction: on InnoDB tables, if any row fails none are inserted. Columns a row omits get the column default; objects and arrays are stored as JSON text. Returns the inserted row count and the auto-increment id of the first row. Use Upsert Row to insert-or-update by key. Not idempotent: repeating it inserts the rows again.',
    idempotent: false,
  },
  props: {
    table: mysqlAiProps.table,
    rows: Property.Json({
      displayName: 'Rows',
      description: 'A list of objects, one per row, e.g. [{"name": "Ada", "age": 36}]. Column names come from Describe Table.',
      required: true,
    }),
  },
  async run(context) {
    const { table, rows } = context.propsValue;
    const records = insertRowsUtils.toRecords({ rows, keepEmptyStrings: true });
    const columns = insertRowsUtils.collectColumns({ records });
    const statements = insertRowsUtils.buildStatements({ quotedTable: sanitizeColumnName(table), columns, records });
    const results: MysqlOkPacket[] = await mysqlAi.withConnection({
      auth: context.auth,
      fn: (conn) =>
        mysqlAi.inTransaction({
          conn,
          readOnly: false,
          fn: async () => {
            const packets: MysqlOkPacket[] = [];
            for (const statement of statements) {
              packets.push(await conn.query(statement.text, statement.values));
            }
            return packets;
          },
        }),
    });
    return {
      affectedRows: results.reduce((total, result) => total + result.affectedRows, 0),
      firstInsertId: results[0]?.insertId ?? 0,
    };
  },
});
