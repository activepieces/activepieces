import { createAction, Property } from '@activepieces/pieces-framework';
import snowflake from 'snowflake-sdk';
import { snowflakeAuth } from '../auth';
import { configureConnection, connect, execute, destroy } from '../common';

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
      context.auth.props,
      context.propsValue.application,
      context.propsValue.timeout
    );

    const { sqlText, binds } = context.propsValue;

    await connect(connection);
    try {
      return await execute(connection, sqlText, binds as snowflake.Binds);
    } finally {
      await destroy(connection);
    }
  },
});
