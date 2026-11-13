import { createAction } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi, mysqlAiProps } from '../../../common/ai';
import { sanitizeColumnName } from '../../../common';
import { mysqlDeleteRowsOutputSchema } from '../../../output-schemas';

export const deleteRowsAi = createAction({
  auth: mysqlAuth,
  name: 'mysql_delete_rows',
  outputSchema: mysqlDeleteRowsOutputSchema,
  displayName: 'Delete Rows',
  description: 'Permanently deletes every row that matches the filters, up to a safety limit.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes all rows matching every filter (at least one filter required); this cannot be undone. Runs in a transaction and deletes nothing if more than Max Rows match; check with Count Rows first. Not idempotent: a repeat may delete rows added since.',
    idempotent: false,
  },
  props: {
    table: mysqlAiProps.table,
    filters: mysqlAiProps.filters({ required: true }),
    maxRows: mysqlAiProps.maxRows({ verb: 'deleted' }),
  },
  async run(context) {
    const { table, filters, maxRows } = context.propsValue;
    const limit = mysqlAi.boundedInteger({ value: maxRows, defaultValue: mysqlAi.WRITE_GUARD_DEFAULT, min: 1, max: mysqlAi.WRITE_GUARD_MAX, label: 'Max Rows' });
    const where = mysqlAi.buildWhere({ filters });
    const quotedTable = sanitizeColumnName(table);
    const result = await mysqlAi.withConnection({
      auth: context.auth,
      fn: (conn) =>
        mysqlAi.guardedWrite({
          conn,
          quotedTable,
          where,
          maxRows: limit,
          verb: 'deleted',
          write: { sql: `DELETE FROM ${quotedTable}${where.sql}`, values: where.values },
        }),
    });
    return { deletedRows: result.affectedRows };
  },
});
