import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlCommon, mysqlConnect, sanitizeColumnName, warningMarkdown } from '../common';
import { mysqlAuth } from '../..';
import { findRowsOutputSchema } from '../output-schemas';

export default createAction({
  auth: mysqlAuth,
  name: 'find_rows',
  displayName: 'Find Rows',
  description: 'Reads rows from a table',
  audience: 'both',
  outputSchema: findRowsOutputSchema,
  aiMetadata: { description: 'Reads rows from a MySQL table that match a SQL WHERE condition, optionally limited to specific columns. Use to look up or filter records by arbitrary criteria. The condition is required and is interpolated raw into the query, so pass dynamic values through the args array (referenced as ? placeholders) to avoid SQL injection. Read-only and idempotent.', idempotent: true },
  propertyGroups: [
    {
      key: 'rows',
      display: 'section',
      label: 'Rows to find',
      icon: 'filter',
      props: ['markdown', 'table', 'condition', 'args'],
    },
    {
      key: 'result',
      display: 'section',
      label: 'What to return',
      icon: 'sliders',
      props: ['columns'],
    },
  ],
  props: {
    markdown: warningMarkdown,
    timezone: mysqlCommon.timezone,
    table: mysqlCommon.table(),
    condition: Property.ShortText({
      displayName: 'Condition',
      description: 'The SQL after WHERE. Write ? where each value goes.',
      placeholder: 'status = ? AND age > ?',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Values for each ? in the condition, in order.',
      required: false,
    }),
    columns: Property.Array({
      displayName: 'Columns',
      description: 'Leave empty to return every column.',
      required: false,
    }),
  },
  async run(context) {
    const columns = context.propsValue.columns ?? [];
    const qsColumns = columns.length === 0
      ? '*'
      : columns.map((column) => sanitizeColumnName(String(column))).join(',');

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
