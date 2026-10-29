import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import { snowflakeCommonProps, toAuthValue, withSnowflake } from '../common';
import { buildSetClause, dmlCount } from '../common/operations';
import { legacyUpdateOutputSchema } from '../common/output-schemas';
import { qualifiedName } from '../common/sql';

export const updateRowAction = createAction({
  name: 'update_row',
  classification: 'WRITE',
  displayName: 'Update Row',
  description:
    'Update one or more rows in a Snowflake table that match a WHERE condition.',
  audience: 'human',
  aiMetadata: {
    description:
      'Runs an UPDATE with a hand-written WHERE condition on a table picked from dropdowns. Human-only; agents use Update Row by Key or Update Rows by Filter. Setting the same values again leaves the rows unchanged.',
    idempotent: true,
  },
  outputSchema: legacyUpdateOutputSchema,
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
    table_update_values: snowflakeCommonProps.table_update_values,
    where_clause: Property.ShortText({
      displayName: 'WHERE Condition',
      description:
        "A SQL condition to filter which rows to update (e.g. `id = 42` or `status = 'active'`). " +
        'To update every row, leave this empty and turn on **Update All Rows**. ' +
        '**Security note:** this value is embedded directly in SQL. Only use static values or data from trusted, internal steps — never pass unvalidated end-user input here.',
      required: false,
    }),
    update_all_rows: Property.Checkbox({
      displayName: 'Update All Rows',
      description:
        'Confirm that an empty WHERE condition should update every row in the table.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { table, table_update_values, where_clause, update_all_rows } =
      context.propsValue;
    const values = Object.fromEntries(
      Object.entries(table_update_values).filter(
        ([, value]) => value !== null && value !== undefined && value !== ''
      )
    );
    if (Object.keys(values).length === 0) {
      throw new Error('At least one column value must be provided to update.');
    }
    const where = (where_clause ?? '').trim();
    if (where === '' && !update_all_rows) {
      throw new Error(
        'The WHERE condition is empty, which would update every row. Add a condition, or turn on "Update All Rows" if that is intended.'
      );
    }
    const set = buildSetClause(values);
    const target = qualifiedName({ value: table, label: 'Table' });
    const sql =
      where === ''
        ? `UPDATE ${target} SET ${set.clause}`
        : `UPDATE ${target} SET ${set.clause} WHERE ${where}`;
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql, binds: set.binds }),
    });
    return {
      success: true,
      rows_updated: dmlCount({ result, key: 'number of rows updated' }),
    };
  },
});
