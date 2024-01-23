import { createAction, Property } from '@activepieces/pieces-framework';
import pg from 'pg';
import { postgresAuth } from '../..';

export const runQuery = createAction({
  auth: postgresAuth,
  name: 'run-query',
  displayName: 'Run Query',
  description: 'Run Query',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      required: true,
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

    return new Promise((resolve, reject) => {
      client.query(query, function (error: any, results: { rows: unknown }) {
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
