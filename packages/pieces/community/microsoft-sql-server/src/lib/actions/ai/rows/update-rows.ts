import { createAction, Property } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../../../auth';
import { mssqlCommon } from '../../../common';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { writeRowsActionOutputSchema } from '../../../output-schemas';

export const updateRowsAi = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_update_rows',
  outputSchema: writeRowsActionOutputSchema,
  displayName: 'Update Rows',
  description: 'Updates every row that matches the filters, up to a safety limit.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Sets the given column values on all rows matching every filter (at least one filter required) and returns the updated rows. Runs in a transaction and changes nothing if more than Max Rows match; check with Count Rows first. Rows come back empty on tables with triggers; rows_affected is always set. Setting the same values again changes nothing new, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    schema: mssqlAiProps.schema,
    table: mssqlAiProps.table,
    filters: mssqlAiProps.filters({ required: true }),
    values: Property.Object({
      displayName: 'Values',
      description: 'Column names mapped to new values, e.g. {"status": "archived"}. Columns left out keep their value.',
      required: true,
    }),
    maxRows: mssqlAiProps.maxRows({ verb: 'updated' }),
  },
  async run(context) {
    const { schema, table, filters, maxRows } = context.propsValue;
    const limit = mssqlAi.boundedInteger({ value: maxRows, defaultValue: mssqlAi.WRITE_GUARD_DEFAULT, min: 1, max: mssqlAi.WRITE_GUARD_MAX, label: 'Max Rows' });
    const set = mssqlAi.buildSet({ values: mssqlAi.parseValues({ value: context.propsValue.values, label: 'Values' }) });
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
          verb: 'updated',
          withOutput: `UPDATE ${quoted} SET ${set.sql} OUTPUT ${mssqlAi.projection({ columns: meta.columns, prefix: 'INSERTED' })}${where.sql}`,
          withoutOutput: `UPDATE ${quoted} SET ${set.sql}${where.sql}`,
          params: { ...set.params, ...where.params },
        });
      },
    });
  },
});
