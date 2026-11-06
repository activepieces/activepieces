import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import { buildSetClause, guardedWrite } from '../../common/operations';
import { updateByKeyOutputSchema } from '../../common/output-schemas';
import { identifier, parseObject, qualifiedName } from '../../common/sql';

export const updateRowByKeyAction = createAction({
  name: 'update_row_by_key',
  classification: 'WRITE',
  displayName: 'Update Row by Key',
  description: 'Update the one row whose key column equals a value.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets the given column values on the single row whose key column equals Key Value; returns found=false when no row matches and rolls back with an error if more than one row matches. Setting the same values again changes nothing, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: updateByKeyOutputSchema,
  auth: snowflakeAuth,
  props: {
    table: aiProps.table(),
    keyColumn: Property.ShortText({
      displayName: 'Key Column',
      description: 'The unique key column, e.g. `ID`.',
      required: true,
    }),
    keyValue: Property.ShortText({
      displayName: 'Key Value',
      description: 'The key value of the row to update.',
      required: true,
    }),
    values: aiProps.values(
      'Values',
      'Column names mapped to new values, e.g. {"STATUS": "shipped"}.'
    ),
  },
  async run(context) {
    const { table, keyColumn, keyValue } = context.propsValue;
    const set = buildSetClause(
      parseObject({ value: context.propsValue.values, label: 'Values' })
    );
    const sql = `UPDATE ${qualifiedName({
      value: table,
      label: 'Table',
    })} SET ${set.clause} WHERE ${identifier({
      name: keyColumn,
      label: 'Key column',
    })} = ?`;
    const rowsAffected = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        guardedWrite({
          session,
          sql,
          binds: [...set.binds, keyValue],
          countKey: 'number of rows updated',
          maxRows: 1,
          tooManyMessage: (count) =>
            `${count} rows have ${keyColumn} = ${keyValue}, so it is not a unique key. Nothing was changed; use Update Rows by Filter instead.`,
        }),
    });
    return { found: rowsAffected > 0, rowsAffected };
  },
});
