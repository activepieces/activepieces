import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import { buildInsert, dmlCount } from '../../common/operations';
import { insertResultOutputSchema } from '../../common/output-schemas';
import { parseRowArray } from '../../common/sql';

const MAX_ROWS = 500;

export const insertRowsJsonAction = createAction({
  name: 'insert_rows_json',
  classification: 'WRITE',
  displayName: 'Insert Rows (JSON)',
  description:
    'Insert up to 500 rows given as an array of objects with the same keys.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Inserts 1–500 rows into a table in one statement; every object must have the same column keys, and object or array values are stored as JSON. All rows are inserted or none. Each call adds the rows again, so a retry duplicates them.',
    idempotent: false,
  },
  outputSchema: insertResultOutputSchema,
  auth: snowflakeAuth,
  props: {
    table: aiProps.table(),
    rows: aiProps.values(
      'Rows',
      'Array of row objects with identical keys, e.g. [{"ID": 1, "NAME": "A"}, {"ID": 2, "NAME": "B"}].'
    ),
  },
  async run(context) {
    const rows = parseRowArray({
      value: context.propsValue.rows,
      label: 'Rows',
    });
    if (rows.length === 0 || rows.length > MAX_ROWS) {
      throw new Error(
        `Rows must contain between 1 and ${MAX_ROWS} objects; got ${rows.length}.`
      );
    }
    const { sql, binds } = buildInsert({
      table: context.propsValue.table,
      rows,
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
