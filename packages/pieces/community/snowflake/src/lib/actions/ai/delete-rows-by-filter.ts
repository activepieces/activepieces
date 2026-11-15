import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import {
  aiProps,
  WRITE_GUARD_DEFAULT,
  WRITE_GUARD_MAX,
} from '../../common/ai-props';
import { guardedWrite } from '../../common/operations';
import { deleteByFilterOutputSchema } from '../../common/output-schemas';
import { boundedInteger, buildWhere, qualifiedName } from '../../common/sql';

export const deleteRowsByFilterAction = createAction({
  name: 'delete_rows_by_filter',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Rows by Filter',
  description:
    'Delete every row that matches the filters, up to a safety limit.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes all rows matching every filter (at least one filter required). Runs in a transaction and rolls back with an error if more than Max Rows would be deleted; check with Count Rows first. A retry deletes nothing more.',
    idempotent: true,
  },
  outputSchema: deleteByFilterOutputSchema,
  auth: snowflakeAuth,
  props: {
    table: aiProps.table(),
    filters: aiProps.filters(true),
    maxRows: Property.Number({
      displayName: 'Max Rows',
      description: `Refuse (and roll back) if more rows than this would be deleted (1–${WRITE_GUARD_MAX}). Defaults to ${WRITE_GUARD_DEFAULT}.`,
      required: false,
      defaultValue: WRITE_GUARD_DEFAULT,
    }),
  },
  async run(context) {
    const { table, filters, maxRows } = context.propsValue;
    const where = buildWhere(filters);
    if (where.clause === '') {
      throw new Error(
        'Provide at least one filter; deleting a whole table is not allowed here.'
      );
    }
    const limit = boundedInteger({
      value: maxRows,
      defaultValue: WRITE_GUARD_DEFAULT,
      min: 1,
      max: WRITE_GUARD_MAX,
      label: 'Max Rows',
    });
    const sql = `DELETE FROM ${qualifiedName({
      value: table,
      label: 'Table',
    })}${where.clause}`;
    const rowsDeleted = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        guardedWrite({
          session,
          sql,
          binds: where.binds,
          countKey: 'number of rows deleted',
          maxRows: limit,
          tooManyMessage: (count) =>
            `The filters match ${count} rows, more than Max Rows (${limit}). Nothing was deleted; narrow the filters or raise Max Rows.`,
        }),
    });
    return { rowsDeleted };
  },
});
