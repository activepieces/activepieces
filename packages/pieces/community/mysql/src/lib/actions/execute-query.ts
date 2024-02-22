import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlCommon, mysqlConnect } from '../common';
import { mysqlAuth } from '../..';

export default createAction({
  auth: mysqlAuth,
  name: 'execute_query',
  displayName: 'Execute Query',
  description: 'Executes a query on the mysql database and returns the results',
  props: {
    timezone: mysqlCommon.timezone,
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The query string to execute, use ? for arguments to avoid SQL injection.',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Can inserted in the query string using ?',
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
