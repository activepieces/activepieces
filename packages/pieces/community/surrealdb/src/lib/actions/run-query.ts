import { createAction, Property } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../..';
import surrealClient from '../common';

export const runQuery = createAction({
  auth: surrealdbAuth,
  name: 'run-query',
  displayName: 'Run Query',
  description: 'Run a query in SurrealDB.',
  props: {
    markdown: Property.MarkDown({
      value: `
        **NOTE:** Prevent SQL injection by using parameterized queries.
      `,
    }),
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Provide a SurrealDB query string to execute.',
      required: true,
    }),
    queryMarkdown: Property.MarkDown({
      value: `
        **NOTE:** Query example: \`SELECT * FROM table_name WHERE name = $name\`. Then add the name parameter in the arguments.
      `,
    }),
    args: Property.Object({
      displayName: 'Arguments',
      description: "Add all arguments as names here, don't add the $ sign.",
      required: false,
    }),
    query_timeout: Property.Number({
      displayName: 'Query Timeout (ms)',
      description:
        'The maximum time to wait for a query to complete before timing out.',
      required: false,
      defaultValue: 30000,
    }),
    application_name: Property.ShortText({
      displayName: 'Application Name',
      description:
        'An identifier for the client application executing the query.',
      required: false,
    }),
  },

  async run(context) {
    try {
      const { query, args } = context.propsValue;
      const response = await surrealClient.query(
        context.auth,
        query,
        args as Record<string, string>
      );
      return response.body;
    } catch (error) {
      throw new Error(`Query execution failed: ${(error as Error).message}`);
    }
  },
});
