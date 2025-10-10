import { createAction, Property } from '@activepieces/pieces-framework';
import snowflake, { Statement, SnowflakeError } from 'snowflake-sdk';
import { snowflakeAuth } from '../../index';
import { configureConnection } from '../common';

type QueryResult = unknown[] | undefined;
type QueryResults = { query: string; result: QueryResult }[];

const DEFAULT_APPLICATION_NAME = 'ActivePieces';
const DEFAULT_QUERY_TIMEOUT = 30000;

export const runMultipleQueries = createAction({
  name: 'runMultipleQueries',
  displayName: 'Run Multiple Queries',
  description: 'Run Multiple Queries',
  auth: snowflakeAuth,
  props: {
    sqlTexts: Property.Array({
      displayName: 'SQL queries',
      description:
        'Array of SQL queries to execute in order, in the same transaction. Use :1, :2… placeholders to use binding parameters. ' +
        'Avoid using "?" to avoid unexpected behaviors when having multiple queries.',
      required: true,
    }),
    binds: Property.Array({
      displayName: 'Parameters',
      description:
        'Binding parameters shared across all queries to prevent SQL injection attacks. ' +
        'Use :1, :2, etc. to reference parameters in order. ' +
        'Avoid using "?" to avoid unexpected behaviors when having multiple queries. ' +
        'Unused parameters are allowed.',
      required: false,
    }),
    useTransaction: Property.Checkbox({
      displayName: 'Use Transaction',
      description:
        'When enabled, all queries will be executed in a single transaction. If any query fails, all changes will be rolled back.',
      required: false,
      defaultValue: false,
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
                      stmt: Statement,
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
