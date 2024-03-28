import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlCommon, mysqlConnect, warningMarkdown } from '../common';
import { mysqlAuth } from '../..';

export default createAction({
  auth: mysqlAuth,
  name: 'execute_query',
  displayName: 'Execute Query',
  description: 'Executes a query on the mysql database and returns the results',
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
