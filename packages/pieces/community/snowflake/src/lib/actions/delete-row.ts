import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import { snowflakeCommonProps, toAuthValue, withSnowflake } from '../common';
import { dmlCount } from '../common/operations';
import { legacyDeleteOutputSchema } from '../common/output-schemas';
import { qualifiedName } from '../common/sql';

export const deleteRowAction = createAction({
  name: 'delete_row',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Row',
  description:
    'Delete one or more rows from a Snowflake table that match a WHERE condition.',
  audience: 'human',
  aiMetadata: {
    description:
      'Runs a DELETE with a hand-written, required WHERE condition on a table picked from dropdowns. Human-only; agents use Delete Row by Key or Delete Rows by Filter. Deleted rows cannot be restored by a retry.',
    idempotent: false,
  },
  outputSchema: legacyDeleteOutputSchema,
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
    where_clause: Property.ShortText({
      displayName: 'WHERE Condition',
      description:
        "A SQL condition to filter which rows to delete (e.g. `id = 42` or `status = 'archived'`). " +
        'This field is required to prevent accidental deletion of all rows. ' +
        '**Security note:** this value is embedded directly in SQL. Only use static values or data from trusted, internal steps — never pass unvalidated end-user input here.',
      required: true,
    }),
  },
  async run(context) {
    const { table, where_clause } = context.propsValue;
    const where = (where_clause ?? '').trim();
    if (where === '') {
      throw new Error('The WHERE condition is required to delete rows.');
    }
    const sql = `DELETE FROM ${qualifiedName({
      value: table,
      label: 'Table',
    })} WHERE ${where}`;
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql }),
    });
    return {
      success: true,
      rows_deleted: dmlCount({ result, key: 'number of rows deleted' }),
    };
  },
});
