import { createAction, Property } from '@activepieces/pieces-framework';
import pg from 'pg';
import { postgresAuth } from '../..';

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
    const {
      host,
      user,
      database,
      password,
      port,
      enable_ssl,
      reject_unauthorized: rejectUnauthorized,
      certificate,
    } = context.auth;
    const {
      query,
      query_timeout,
      application_name,
      connection_timeout_ms: connectionTimeoutMillis,
    } = context.propsValue;
    const sslConf = {
      rejectUnauthorized: rejectUnauthorized,
      ca: certificate && certificate.length > 0 ? certificate : undefined,
    };
    const client = new pg.Client({
      host,
      port: Number(port),
      user,
      password,
      database,
      ssl: enable_ssl ? sslConf : undefined,
      query_timeout: Number(query_timeout),
      statement_timeout: Number(query_timeout),
      application_name,
      connectionTimeoutMillis: Number(connectionTimeoutMillis),
    });
    await client.connect();

    const args = context.propsValue.args || [];
    return new Promise((resolve, reject) => {
      client.query(query, args, function (error: any, results: { rows: unknown }) {
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
