import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  DEFAULT_APPLICATION_NAME,
  toAuthValue,
  withSnowflake,
} from '../common';
import { rawRowsOutputSchema } from '../common/output-schemas';
import { toBind } from '../common/sql';

const DEFAULT_QUERY_TIMEOUT = 30000;

export const runQuery = createAction({
  name: 'runQuery',
  classification: 'WRITE',
  displayName: 'Run Query',
  description:
    'Execute a SQL query against your Snowflake database and return the results as rows.',
  audience: 'human',
  aiMetadata: {
    description:
      'Runs one arbitrary SQL statement (SELECT, DML or DDL) and returns all result rows. Human-only escape hatch; agents should use Run Select Query for reads and the dedicated row actions for writes. Re-running repeats any change the statement makes.',
    idempotent: false,
  },
  outputSchema: rawRowsOutputSchema,
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
        'Maximum time in milliseconds the query may run before Snowflake cancels it (applied as STATEMENT_TIMEOUT_IN_SECONDS, capped at 540 seconds). Defaults to 30 000 ms (30 seconds).',
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
    const { sqlText, binds, timeout, application } = context.propsValue;
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      application: application || DEFAULT_APPLICATION_NAME,
      statementTimeoutSeconds: (timeout ?? DEFAULT_QUERY_TIMEOUT) / 1000,
      fn: (session) =>
        session.query({ sql: sqlText, binds: (binds ?? []).map(toBind) }),
    });
    return result.rows;
  },
});
