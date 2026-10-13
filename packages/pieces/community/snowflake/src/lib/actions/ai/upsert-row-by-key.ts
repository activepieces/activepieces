import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import { buildMerge } from '../../common/merge';
import { dmlCount } from '../../common/operations';
import { upsertOutputSchema } from '../../common/output-schemas';
import { parseObject, parseStringList } from '../../common/sql';

export const upsertRowByKeyAction = createAction({
  name: 'upsert_row_by_key',
  classification: 'WRITE',
  displayName: 'Upsert Row by Key',
  description:
    'Insert a row, or update the existing row with the same key values (MERGE).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates or updates one row with MERGE, matching on the given key column(s), which must also appear in Row. Returns how many rows were inserted and updated. Running it again with the same values leaves the same row, so it is safe to retry. Key values must not be null.',
    idempotent: true,
  },
  outputSchema: upsertOutputSchema,
  auth: snowflakeAuth,
  props: {
    table: aiProps.table(),
    keyColumns: Property.Array({
      displayName: 'Key Columns',
      description: 'Column(s) that identify the row, e.g. ["ID"].',
      required: true,
    }),
    row: aiProps.values(
      'Row',
      'Column names mapped to values, including the key column(s).'
    ),
  },
  async run(context) {
    const keyColumns = parseStringList({
      value: context.propsValue.keyColumns,
      label: 'Key Columns',
    });
    const values = parseObject({ value: context.propsValue.row, label: 'Row' });
    const { sql, binds } = buildMerge({
      table: context.propsValue.table,
      keyColumns,
      values,
    });
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql, binds }),
    });
    return {
      rowsInserted: dmlCount({ result, key: 'number of rows inserted' }),
      rowsUpdated: dmlCount({ result, key: 'number of rows updated' }),
      queryId: result.queryId,
    };
  },
});
