import { createAction, Property } from '@activepieces/pieces-framework';
import snowflake from 'snowflake-sdk';
import { snowflakeAuth } from '../auth';
import {
  configureConnection,
  connect,
  execute,
  destroy,
  SnowflakeAuthValue,
} from '../common';

const DEFAULT_APPLICATION_NAME = 'ActivePieces';
const DEFAULT_QUERY_TIMEOUT = 30000;

export const runQuery = createAction({
  name: 'runQuery',
  displayName: 'Run Query',
  description:
    'Execute a SQL query against your Snowflake database and return the results as rows.',
  auth: snowflakeAuth,
  props: {
    sqlText: Property.LongText({
      displayName: 'SQL Query',
      description:
        'The SQL statement to execute. Use `:1`, `:2`… or `?` as placeholders for the **Parameters** values below to safely pass dynamic values without SQL injection risk.',
      required: true,
    }),
    binds: Property.Array({
      displayName: 'Parameters',
      description:
        'Values to bind to the placeholders (`:1`, `:2`…, or `?`) in the SQL query. Provide them in the same order they appear in the query. Using parameters is the safe way to pass dynamic values — never concatenate user input directly into the SQL.',
      required: false,
    }),
    timeout: Property.Number({
      displayName: 'Query Timeout (ms)',
      description:
        'Maximum time in milliseconds to wait for the query to complete before cancelling it. Defaults to 30 000 ms (30 seconds).',
      required: false,
      defaultValue: DEFAULT_QUERY_TIMEOUT,
    }),
    application: Property.ShortText({
      displayName: 'Application Name',
      description:
        'An optional label sent to Snowflake to identify this client. Visible in query history under **Monitoring → Query History → Client Application**. Useful for auditing which automation triggered a query.',
      required: false,
      defaultValue: DEFAULT_APPLICATION_NAME,
    }),
  },
  async run(context) {
    const connection = configureConnection(
      context.auth as SnowflakeAuthValue,
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
