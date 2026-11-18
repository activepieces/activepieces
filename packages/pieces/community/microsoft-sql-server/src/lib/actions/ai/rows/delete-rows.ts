import { createAction } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../../../auth';
import { mssqlCommon } from '../../../common';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { writeRowsActionOutputSchema } from '../../../output-schemas';

export const deleteRowsAi = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_delete_rows',
  outputSchema: writeRowsActionOutputSchema,
  displayName: 'Delete Rows',
  description: 'Permanently deletes every row that matches the filters, up to a safety limit.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes all rows matching every filter (at least one filter required) and returns the deleted rows. Runs in a transaction and deletes nothing if more than Max Rows match; check with Count Rows first. Rows come back empty on tables with triggers; rows_affected is always set. There is no undo.',
    idempotent: false,
  },
  props: {
    schema: mssqlAiProps.schema,
    table: mssqlAiProps.table,
    filters: mssqlAiProps.filters({ required: true }),
    maxRows: mssqlAiProps.maxRows({ verb: 'deleted' }),
  },
  async run(context) {
    const { schema, table, filters, maxRows } = context.propsValue;
    const limit = mssqlAi.boundedInteger({ value: maxRows, defaultValue: mssqlAi.WRITE_GUARD_DEFAULT, min: 1, max: mssqlAi.WRITE_GUARD_MAX, label: 'Max Rows' });
    const where = mssqlAi.buildWhere({ filters });
    return mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const target = await mssqlAi.resolveObject({ pool, schema, name: table, kinds: mssqlAi.TABLE_KINDS, label: 'Table' });
        const meta = await mssqlCommon.getTableMeta({ pool, table: target });
        const quoted = mssqlCommon.quoteTable(target);
        return mssqlAi.guardedWrite({
          pool,
          target: quoted,
          where,
          maxRows: limit,
          verb: 'deleted',
          withOutput: `DELETE FROM ${quoted} OUTPUT ${mssqlAi.projection({ columns: meta.columns, prefix: 'DELETED' })}${where.sql}`,
          withoutOutput: `DELETE FROM ${quoted}${where.sql}`,
          params: where.params,
        });
      },
    });
  },
});
