import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi, mysqlAiProps } from '../../../common/ai';
import { sanitizeColumnName } from '../../../common';
import { mysqlUpdateRowsOutputSchema } from '../../../output-schemas';

export const updateRowsAi = createAction({
  auth: mysqlAuth,
  name: 'mysql_update_rows',
  outputSchema: mysqlUpdateRowsOutputSchema,
  displayName: 'Update Rows',
  description: 'Updates every row that matches the filters, up to a safety limit.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Sets the given column values on all rows matching every filter (at least one filter required). Runs in a transaction and changes nothing if more than Max Rows match; check with Count Rows first. matchedRows counts rows the filters hit, changedRows those whose values actually changed. Setting the same values again changes nothing, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    table: mysqlAiProps.table,
    filters: mysqlAiProps.filters({ required: true }),
    values: Property.Object({
      displayName: 'Values',
      description: 'Column names mapped to new values, e.g. {"status": "archived"}. Columns left out keep their value.',
      required: true,
    }),
    maxRows: mysqlAiProps.maxRows({ verb: 'updated' }),
  },
  async run(context) {
    const { table, filters, maxRows } = context.propsValue;
    const limit = mysqlAi.boundedInteger({ value: maxRows, defaultValue: mysqlAi.WRITE_GUARD_DEFAULT, min: 1, max: mysqlAi.WRITE_GUARD_MAX, label: 'Max Rows' });
    const set = mysqlAi.buildSet({ values: mysqlAi.parseValues({ value: context.propsValue.values, label: 'Values' }) });
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
          verb: 'updated',
          write: { sql: `UPDATE ${quotedTable} SET ${set.sql}${where.sql}`, values: [...set.values, ...where.values] },
        }),
    });
    return { matchedRows: result.affectedRows, changedRows: result.changedRows };
  },
});
