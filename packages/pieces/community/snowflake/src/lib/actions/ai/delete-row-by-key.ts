import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import { guardedWrite } from '../../common/operations';
import { deleteByKeyOutputSchema } from '../../common/output-schemas';
import { identifier, qualifiedName } from '../../common/sql';

export const deleteRowByKeyAction = createAction({
  name: 'delete_row_by_key',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Row by Key',
  description: 'Delete the one row whose key column equals a value.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes the single row whose key column equals Key Value. Returns alreadyDeleted=true when no row matches (so a retry is harmless) and rolls back with an error if more than one row matches.',
    idempotent: true,
  },
  outputSchema: deleteByKeyOutputSchema,
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
      description: 'The key value of the row to delete.',
      required: true,
    }),
  },
  async run(context) {
    const { table, keyColumn, keyValue } = context.propsValue;
    const sql = `DELETE FROM ${qualifiedName({
      value: table,
      label: 'Table',
    })} WHERE ${identifier({ name: keyColumn, label: 'Key column' })} = ?`;
    const deleted = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        guardedWrite({
          session,
          sql,
          binds: [keyValue],
          countKey: 'number of rows deleted',
          maxRows: 1,
          tooManyMessage: (count) =>
            `${count} rows have ${keyColumn} = ${keyValue}, so it is not a unique key. Nothing was deleted; use Delete Rows by Filter instead.`,
        }),
    });
    return { deleted: deleted > 0, alreadyDeleted: deleted === 0 };
  },
});
