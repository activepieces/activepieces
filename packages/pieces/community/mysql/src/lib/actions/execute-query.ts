import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlCommon, mysqlConnect, warningMarkdown } from '../common';
import { mysqlAuth } from '../..';

export default createAction({
  auth: mysqlAuth,
  name: 'execute_query',
  displayName: 'Execute Query',
  description: 'Executes a query on the mysql database and returns the results',
  audience: 'both',
  aiMetadata: { description: 'Runs an arbitrary SQL statement against the MySQL database and returns its results. Use as the escape hatch when the dedicated find/insert/update/delete actions cannot express the operation (joins, DDL, multi-table writes, aggregates). Pass dynamic values through the args array as ? placeholders to avoid SQL injection. Not idempotent in general: the effect and repeat-safety depend entirely on the SQL you supply (a SELECT is safe to repeat, an INSERT or UPDATE may not be).', idempotent: false },
  props: {
    markdown: warningMarkdown,
    timezone: mysqlCommon.timezone,
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The query string to execute, use ? for arguments to avoid SQL injection.',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Arguments to use in the query, if any. Should be in the same order as the ? in the query string..',
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
