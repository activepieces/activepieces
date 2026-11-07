import { createAction } from '@activepieces/pieces-framework';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresDeleteRowsOutputSchema } from '../../../output-schemas';

export const deleteRowsAi = createAction({
  auth: postgresAuth,
  name: 'postgres_delete_rows',
  outputSchema: postgresDeleteRowsOutputSchema,
  displayName: 'Delete Rows',
  description: 'Permanently deletes every row that matches the filters, up to a safety limit.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes all rows matching every filter (at least one filter required) and returns the deleted rows as they were. Runs in a transaction and deletes nothing if more than Max Rows match; check with Count Rows first. Cannot be undone.',
    idempotent: false,
  },
  props: {
    table: postgresAiProps.table,
    filters: postgresAiProps.filters({ required: true }),
    maxRows: postgresAiProps.maxRows({ verb: 'deleted' }),
  },
  async run(context) {
    const { table, filters, maxRows } = context.propsValue;
    const limit = postgresAi.boundedInteger({ value: maxRows, defaultValue: postgresAi.WRITE_GUARD_DEFAULT, min: 1, max: postgresAi.WRITE_GUARD_MAX, label: 'Max Rows' });
    const where = postgresAi.buildWhere({ filters, startAt: 0 });
    const quotedTable = postgresAi.quoteName({ name: table });
    return postgresAi.withClient({
      auth: context.auth,
      fn: (client) =>
        postgresAi.guardedWrite({
          client,
          quotedTable,
          where,
          maxRows: limit,
          verb: 'deleted',
          write: { sql: `DELETE FROM ${quotedTable}${where.sql} RETURNING *`, values: where.values },
        }),
    });
  },
});
