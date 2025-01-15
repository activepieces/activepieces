import { createAction, Property } from '@activepieces/pieces-framework';
import snowflake, { Statement, SnowflakeError } from 'snowflake-sdk';
import { snowflakeAuth } from '../../index';

type QueryResult = unknown[] | undefined;

const DEFAULT_APPLICATION_NAME = 'ActivePieces';
const DEFAULT_QUERY_TIMEOUT = 30000;

export const runQueries = createAction({
  name: 'runQueries',
  displayName: 'Run Queries',
  description: 'Run Queries',
  auth: snowflakeAuth,
  props: {
    sqlTexts: Property.Array({
      displayName: 'SQL queries',
      description:
        'Array of SQL queries to execute in order, in the same transaction. Use :1, :2… or ? placeholders to use binding parameters.',
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
    const { username, password, role, database, warehouse, account } =
      context.auth;

    const connection = snowflake.createConnection({
      application: context.propsValue.application,
      timeout: context.propsValue.timeout,
      username,
      password,
      role,
      database,
      warehouse,
      account,
    });

    return new Promise<QueryResult>((resolve, reject) => {
      connection.connect(function (err: SnowflakeError | undefined) {
        if (err) {
          reject(err);
          return;
        }

        connection.execute({
          sqlText: 'BEGIN',
          complete: (err: SnowflakeError | undefined) => {
            if (err) {
              reject(err);
              return;
            }
            executeQueriesSequentially();
          },
        });

        const { sqlTexts, binds } = context.propsValue;
        let lastQueryResult: QueryResult = [];

        function handleError(err: SnowflakeError) {
          connection.execute({
            sqlText: 'ROLLBACK',
            complete: () => {
              connection.destroy(() => {
                reject(err);
              });
            },
          });
        }

        async function executeQueriesSequentially() {
          try {
            for (const sqlText of sqlTexts) {
              lastQueryResult = await new Promise<QueryResult>(
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
            }

            connection.execute({
              sqlText: 'COMMIT',
              complete: (err: SnowflakeError | undefined) => {
                if (err) {
                  handleError(err);
                  return;
                }
                connection.destroy((err: SnowflakeError | undefined) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  resolve(lastQueryResult);
                });
              },
            });
          } catch (err) {
            handleError(err as SnowflakeError); // Reject with the original error!
          }
        }
      });
    });
  },
});
