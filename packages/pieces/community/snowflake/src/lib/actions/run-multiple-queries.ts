import { createAction, Property } from '@activepieces/pieces-framework';
import snowflake, { RowStatement, SnowflakeError } from 'snowflake-sdk';
import { snowflakeAuth } from '../auth';
import { configureConnection, SnowflakeAuthValue } from '../common';

type QueryResult = unknown[] | undefined;
type QueryResults = { query: string; result: QueryResult }[];

const DEFAULT_APPLICATION_NAME = 'ActivePieces';
const DEFAULT_QUERY_TIMEOUT = 30000;

export const runMultipleQueries = createAction({
  name: 'runMultipleQueries',
  displayName: 'Run Multiple Queries',
  description:
    'Execute multiple SQL statements in sequence against your Snowflake database. Optionally wrap them in a transaction so all changes are rolled back if any statement fails.',
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
        'Maximum time in milliseconds to wait for each query to complete before cancelling it. Defaults to 30 000 ms (30 seconds).',
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
    const connection = configureConnection(
      context.auth as SnowflakeAuthValue,
      context.propsValue.application,
      context.propsValue.timeout
    );

    return new Promise<QueryResults>((resolve, reject) => {
      connection.connect(async function (err: SnowflakeError | undefined) {
        if (err) {
          reject(err);
          return;
        }

        const { sqlTexts, binds, useTransaction } = context.propsValue;
        const queryResults: QueryResults = [];

        function handleError(err: SnowflakeError) {
          if (useTransaction) {
            connection.execute({
              sqlText: 'ROLLBACK',
              complete: () => {
                connection.destroy(() => {
                  reject(err);
                });
              },
            });
          } else {
            connection.destroy(() => {
              reject(err);
            });
          }
        }

        async function executeQueriesSequentially() {
          try {
            if (useTransaction) {
              await new Promise<void>((resolveBegin, rejectBegin) => {
                connection.execute({
                  sqlText: 'BEGIN',
                  complete: (err: SnowflakeError | undefined) => {
                    if (err) rejectBegin(err);
                    else resolveBegin();
                  },
                });
              });
            }
            for (const sqlText of sqlTexts) {
              const result = await new Promise<QueryResult>(
                (resolveQuery, rejectQuery) => {
                  connection.execute({
                    sqlText: sqlText as string,
                    binds: binds as snowflake.Binds,
                    complete: (
                      err: SnowflakeError | undefined,
                      stmt: RowStatement,
                      rows: QueryResult
                    ) => {
                      if (err) {
                        rejectQuery(err);
                        return;
                      }
                      resolveQuery(rows);
                    },
                  });
                }
              );

              queryResults.push({
                query: sqlText as string,
                result,
              });
            }

            if (useTransaction) {
              await new Promise<void>((resolveCommit, rejectCommit) => {
                connection.execute({
                  sqlText: 'COMMIT',
                  complete: (err: SnowflakeError | undefined) => {
                    if (err) rejectCommit(err);
                    else resolveCommit();
                  },
                });
              });
            }

            connection.destroy((err: SnowflakeError | undefined) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(queryResults);
            });
          } catch (err) {
            handleError(err as SnowflakeError); // Reject with the original error!
          }
        }

        executeQueriesSequentially();
      });
    });
  },
});
