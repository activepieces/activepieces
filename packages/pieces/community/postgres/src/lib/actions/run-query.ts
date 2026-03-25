import { createAction, Property } from '@activepieces/pieces-framework';
import pg from 'pg';
import { postgresAuth } from '../..';
import { pgClient } from '../common';

export const runQuery = createAction({
  auth: postgresAuth,
  name: 'run-query',
  displayName: 'Run Query',
  description: 'Run Query',
  props: {
    markdown: Property.MarkDown({
      value: `
      **DO NOT** insert dynamic input directly into the query string. Instead, use $1, $2, $3 and add them in args for parameterized queries to prevent **SQL injection.**`
    }),

    query: Property.ShortText({
      displayName: 'Query',
      description: 'Please use $1, $2, etc. for parameterized queries to avoid SQL injection.',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Arguments to be used in the query',
      required: false,
    }),
    query_timeout: Property.Number({
      displayName: 'Query Timeout',
      description:
        'An integer indicating the maximum number of milliseconds to wait for a query to complete before timing out.',
      required: false,
      defaultValue: 30000,
    }),
    connection_timeout_ms: Property.Number({
      displayName: 'Connection Timeout (ms)',
      description:
        'An integer indicating the maximum number of milliseconds to wait for a connection to be established before timing out.',
      required: false,
      defaultValue: 30000,
    }),
    application_name: Property.ShortText({
      displayName: 'Application Name',
      description:
        'A string indicating the name of the client application connecting to the server.',
      required: false,
    }),
  },
  async run(context) {
    const client = await pgClient(context.auth, context.propsValue.query_timeout, context.propsValue.application_name, context.propsValue.connection_timeout_ms);
    const { query } = context.propsValue;
    const queryWithMetadata = `
    /* Source : /projects/${context.project.id}/flows/${context.flows.current.id}/runs/${context.run.id} */
    ${query}
    `
    const args = context.propsValue.args || [];
    return new Promise((resolve, reject) => {
      client.query(queryWithMetadata, args, function (error: any, results: { rows: unknown }) {
        if (error) {
          client.end();
          return reject(error);
        }
        resolve(results.rows);
        client.end();
      });
    });
  },
});
