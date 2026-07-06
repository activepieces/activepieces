import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlCommon, mysqlConnect, sanitizeColumnName, warningMarkdown } from '../common';
import { mysqlAuth } from '../..';

export default createAction({
  auth: mysqlAuth,
  name: 'find_rows',
  displayName: 'Find Rows',
  description: 'Reads rows from a table',
  audience: 'both',
  aiMetadata: { description: 'Reads rows from a MySQL table that match a SQL WHERE condition, optionally limited to specific columns. Use to look up or filter records by arbitrary criteria. The condition is required and is interpolated raw into the query, so pass dynamic values through the args array (referenced as ? placeholders) to avoid SQL injection. Read-only and idempotent.', idempotent: true },
  props: {
    markdown: warningMarkdown,
    timezone: mysqlCommon.timezone,
    table: mysqlCommon.table(),
    condition: Property.ShortText({
      displayName: 'Condition',
      description: 'SQL condition, can also include logic operators, etc.',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Arguments can be used using ? in the condition',
      required: false,
    }),
    columns: Property.Array({
      displayName: 'Columns',
      description: 'Specify the columns you want to select',
      required: false,
    }),
  },
  async run(context) {
    const columns = (context.propsValue.columns as string[]) || ['*'];
    const qsColumns = columns
      .map((c) => sanitizeColumnName(c))
      .join(',');

    const qs = `SELECT ${qsColumns} FROM ${sanitizeColumnName(context.propsValue.table)} WHERE ${context.propsValue.condition};`;

    const conn = await mysqlConnect(context.auth, context.propsValue);

    try {
      const results = await conn.query(qs, context.propsValue.args);
      return { results };
    } finally {
      await conn.end();
    }
  },
});
