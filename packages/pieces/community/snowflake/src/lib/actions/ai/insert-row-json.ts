import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import { buildInsert, dmlCount } from '../../common/operations';
import { insertResultOutputSchema } from '../../common/output-schemas';
import { parseObject } from '../../common/sql';

export const insertRowJsonAction = createAction({
  name: 'insert_row_json',
  classification: 'WRITE',
  displayName: 'Insert Row (JSON)',
  description: 'Insert one row given as a column-to-value object.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Inserts one row into a table from an object of column names to values; object or array values are stored as JSON (VARIANT). Use Insert Rows (JSON) for several rows and Upsert Row by Key to avoid duplicates. Each call adds a new row, so a retry duplicates it.',
    idempotent: false,
  },
  outputSchema: insertResultOutputSchema,
  auth: snowflakeAuth,
  props: {
    table: aiProps.table(),
    row: aiProps.values(
      'Row',
      'Column names mapped to values, e.g. {"ID": 7, "EMAIL": "jo@example.com", "TAGS": ["a", "b"]}.'
    ),
  },
  async run(context) {
    const row = parseObject({ value: context.propsValue.row, label: 'Row' });
    const { sql, binds } = buildInsert({
      table: context.propsValue.table,
      rows: [row],
    });
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql, binds }),
    });
    return {
      rowsInserted: dmlCount({ result, key: 'number of rows inserted' }),
      queryId: result.queryId,
    };
  },
});
