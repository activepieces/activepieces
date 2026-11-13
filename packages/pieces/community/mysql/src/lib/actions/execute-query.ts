import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlCommon, mysqlConnect, warningMarkdown } from '../common';
import { mysqlAuth } from '../..';

export default createAction({
  auth: mysqlAuth,
  name: 'execute_query',
  displayName: 'Run Query',
  description: 'Runs a SQL statement on the database and returns its results',
  audience: 'both',
  aiMetadata: { description: 'Runs an arbitrary SQL statement against the MySQL database and returns its results. Use as the escape hatch when the dedicated find/insert/update/delete actions cannot express the operation (joins, DDL, multi-table writes, aggregates). Pass dynamic values through the args array as ? placeholders to avoid SQL injection. Not idempotent in general: the effect and repeat-safety depend entirely on the SQL you supply (a SELECT is safe to repeat, an INSERT or UPDATE may not be).', idempotent: false },
  propertyGroups: [
    {
      key: 'sql',
      display: 'section',
      label: 'SQL statement',
      icon: 'code',
      props: ['markdown', 'query', 'args'],
    },
  ],
  props: {
    markdown: warningMarkdown,
    timezone: mysqlCommon.timezone,
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The SQL to run. Write ? where each value goes.',
      placeholder: 'SELECT * FROM orders WHERE id = ?',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Values for each ? in the query, in order.',
      required: false,
    }),
  },
  async run(context) {
    const conn = await mysqlConnect(context.auth, context.propsValue);
    try {
      const results = await conn.query(
        context.propsValue.query,
        context.propsValue.args || []
      );
      return Array.isArray(results) ? { results } : results;
    } finally {
      await conn.end();
    }
  },
});
