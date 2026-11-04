import { createAction, Property } from '@activepieces/pieces-framework';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresUpdateRowsOutputSchema } from '../../../output-schemas';

export const updateRowsAi = createAction({
  auth: postgresAuth,
  name: 'postgres_update_rows',
  outputSchema: postgresUpdateRowsOutputSchema,
  displayName: 'Update Rows',
  description: 'Updates every row that matches the filters, up to a safety limit.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Sets the given column values on all rows matching every filter (at least one filter required) and returns the updated rows. Runs in a transaction and changes nothing if more than Max Rows match; check with Count Rows first. Setting the same values again leaves the same rows, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    table: postgresAiProps.table,
    filters: postgresAiProps.filters({ required: true }),
    values: Property.Object({
      displayName: 'Values',
      description: 'Column names mapped to new values, e.g. {"status": "archived"}. Columns left out keep their value.',
      required: true,
    }),
    maxRows: postgresAiProps.maxRows({ verb: 'updated' }),
  },
  async run(context) {
    const { table, filters, maxRows } = context.propsValue;
    const limit = postgresAi.boundedInteger({ value: maxRows, defaultValue: postgresAi.WRITE_GUARD_DEFAULT, min: 1, max: postgresAi.WRITE_GUARD_MAX, label: 'Max Rows' });
    const set = postgresAi.buildSet({ values: postgresAi.parseValues({ value: context.propsValue.values, label: 'Values' }), startAt: 0 });
    const where = postgresAi.buildWhere({ filters, startAt: set.values.length });
    const quotedTable = postgresAi.quoteName({ name: table });
    return postgresAi.withClient({
      auth: context.auth,
      fn: (client) =>
        postgresAi.guardedWrite({
          client,
          quotedTable,
          where: postgresAi.buildWhere({ filters, startAt: 0 }),
          maxRows: limit,
          verb: 'updated',
          write: { sql: `UPDATE ${quotedTable} SET ${set.sql}${where.sql} RETURNING *`, values: [...set.values, ...where.values] },
        }),
    });
  },
});
