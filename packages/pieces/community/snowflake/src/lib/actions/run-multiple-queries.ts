import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  DEFAULT_APPLICATION_NAME,
  toAuthValue,
  withSnowflake,
} from '../common';
import { multipleQueriesOutputSchema } from '../common/output-schemas';
import { toBind } from '../common/sql';

const DEFAULT_QUERY_TIMEOUT = 30000;

export const runMultipleQueries = createAction({
  name: 'runMultipleQueries',
  classification: 'WRITE',
  displayName: 'Run Multiple Queries',
  description:
    'Execute multiple SQL statements in sequence against your Snowflake database. Optionally wrap them in a transaction so all changes are rolled back if any statement fails.',
  audience: 'human',
  aiMetadata: {
    description:
      'Runs an ordered list of SQL statements in one session, optionally inside one transaction that rolls back on failure. Human-only; agents chain the atomic actions instead. Re-running repeats every change.',
    idempotent: false,
  },
  outputSchema: multipleQueriesOutputSchema,
  auth: snowflakeAuth,
  props: {
    sqlTexts: Property.Array({
      displayName: 'SQL Queries',
      description:
        'List of SQL statements to run in order. Use `:1`, `:2`… placeholders to reference shared **Parameters** values. Avoid `?` placeholders when running multiple queries — use numbered placeholders instead to prevent unexpected behaviour.',
      required: true,
    }),
    binds: Property.Array({
      displayName: 'Parameters',
      description:
        'Values shared across all queries for the numbered placeholders (`:1`, `:2`…). Provide them in order. Unused parameters are allowed.',
      required: false,
    }),
    useTransaction: Property.Checkbox({
      displayName: 'Use Transaction',
      description:
        'When enabled, all queries run inside a single transaction. If any query fails, every preceding change in this batch is rolled back automatically.',
      required: false,
      defaultValue: false,
    }),
    timeout: Property.Number({
      displayName: 'Query Timeout (ms)',
      description:
        'Maximum time in milliseconds each query may run before Snowflake cancels it (applied as STATEMENT_TIMEOUT_IN_SECONDS, capped at 540 seconds). Defaults to 30 000 ms (30 seconds).',
      required: false,
      defaultValue: DEFAULT_QUERY_TIMEOUT,
    }),
    application: Property.ShortText({
      displayName: 'Application Name',
      description:
        'An optional label sent to Snowflake to identify this client. Visible in query history under **Monitoring → Query History → Client Application**.',
      required: false,
      defaultValue: DEFAULT_APPLICATION_NAME,
    }),
  },
  async run(context) {
    const { sqlTexts, binds, useTransaction, timeout, application } =
      context.propsValue;
    const bindValues = (binds ?? []).map(toBind);
    return withSnowflake({
      auth: toAuthValue(context.auth),
      application: application || DEFAULT_APPLICATION_NAME,
      statementTimeoutSeconds: (timeout ?? DEFAULT_QUERY_TIMEOUT) / 1000,
      fn: async (session) => {
        const results: { query: string; result: unknown[] }[] = [];
        if (useTransaction) await session.query({ sql: 'BEGIN' });
        try {
          for (const sqlText of sqlTexts) {
            const query = String(sqlText);
            const result = await session.query({
              sql: query,
              binds: bindValues,
            });
            results.push({ query, result: result.rows });
          }
          if (useTransaction) await session.query({ sql: 'COMMIT' });
        } catch (error) {
          if (useTransaction) {
            await session.query({ sql: 'ROLLBACK' }).catch(() => undefined);
          }
          throw error;
        }
        return results;
      },
    });
  },
});
