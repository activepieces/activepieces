import { createAction, Property } from '@activepieces/pieces-framework';
import snowflake from 'snowflake-sdk';
import { snowflakeAuth } from '../../index';
import { configureConnection } from '../common';

const DEFAULT_APPLICATION_NAME = 'ActivePieces';
const DEFAULT_QUERY_TIMEOUT = 30000;

export const runQuery = createAction({
  name: 'runQuery',
  displayName: 'Run Query',
  description: 'Run Query',
  auth: snowflakeAuth,
  props: {
    sqlText: Property.ShortText({
      displayName: 'SQL query',
      description: 'Use :1, :2… or ? placeholders to use binding parameters.',
      required: true,
    }),
    binds: Property.Array({
      displayName: 'Parameters',
      description:
        'Binding parameters for the SQL query (to prevent SQL injection attacks)',
      required: false,
    }),
    timeout: Property.Number({
      displayName: 'Query timeout (ms)',
      description:
        'An integer indicating the maximum number of milliseconds to wait for a query to complete before timing out.',
      required: false,
      defaultValue: DEFAULT_QUERY_TIMEOUT,
    }),
    application: Property.ShortText({
      displayName: 'Application name',
      description:
        'A string indicating the name of the client application connecting to the server.',
      required: false,
      defaultValue: DEFAULT_APPLICATION_NAME,
    }),
  },
  async run(context) {
    const connection = configureConnection(
      context.auth,
      context.propsValue.application,
      context.propsValue.timeout
    );

    return new Promise((resolve, reject) => {
      connection.connect(function (err, conn) {
        if (err) {
          reject(err);
        }
      });

      const { sqlText, binds } = context.propsValue;

      connection.execute({
        sqlText,
        binds: binds as snowflake.Binds,
        complete: (err, stmt, rows) => {
          if (err) {
            reject(err);
          }
          connection.destroy((err, conn) => {
            if (err) {
              reject(err);
            }
          });
          resolve(rows);
        },
      });
    });
  },
});
