import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import {
  aiProps,
  WRITE_GUARD_DEFAULT,
  WRITE_GUARD_MAX,
} from '../../common/ai-props';
import { buildSetClause, guardedWrite } from '../../common/operations';
import { updateByFilterOutputSchema } from '../../common/output-schemas';
import {
  boundedInteger,
  buildWhere,
  parseObject,
  qualifiedName,
} from '../../common/sql';

export const updateRowsByFilterAction = createAction({
  name: 'update_rows_by_filter',
  classification: 'WRITE',
  displayName: 'Update Rows by Filter',
  description:
    'Update every row that matches the filters, up to a safety limit.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets the given column values on all rows matching every filter (at least one filter required). Runs in a transaction and rolls back with an error if more than Max Rows would change; check with Count Rows first. Setting the same values again changes nothing, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: updateByFilterOutputSchema,
  auth: snowflakeAuth,
  props: {
    table: aiProps.table(),
    filters: aiProps.filters(true),
    values: aiProps.values(
      'Values',
      'Column names mapped to new values, e.g. {"STATUS": "archived"}.'
    ),
    maxRows: Property.Number({
      displayName: 'Max Rows',
      description: `Refuse (and roll back) if more rows than this would be updated (1–${WRITE_GUARD_MAX}). Defaults to ${WRITE_GUARD_DEFAULT}.`,
      required: false,
      defaultValue: WRITE_GUARD_DEFAULT,
    }),
  },
  async run(context) {
    const { table, filters, values, maxRows } = context.propsValue;
    const where = buildWhere(filters);
    if (where.clause === '') {
      throw new Error(
        'Provide at least one filter; updating a whole table is not allowed here.'
      );
    }
    const limit = boundedInteger({
      value: maxRows,
      defaultValue: WRITE_GUARD_DEFAULT,
      min: 1,
      max: WRITE_GUARD_MAX,
      label: 'Max Rows',
    });
    const set = buildSetClause(parseObject({ value: values, label: 'Values' }));
    const sql = `UPDATE ${qualifiedName({
      value: table,
      label: 'Table',
    })} SET ${set.clause}${where.clause}`;
    const rowsAffected = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        guardedWrite({
          session,
          sql,
          binds: [...set.binds, ...where.binds],
          countKey: 'number of rows updated',
          maxRows: limit,
          tooManyMessage: (count) =>
            `The filters match ${count} rows, more than Max Rows (${limit}). Nothing was changed; narrow the filters or raise Max Rows.`,
        }),
    });
    return { rowsAffected };
  },
});
