import {
  createAction,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import snowflake from 'snowflake-sdk';
import { snowflakeAuth } from '../../index';
import { reject } from 'lodash';
import { configureConnection, connect, getConnection } from '../common';

const DEFAULT_APPLICATION_NAME = 'ActivePieces';
const DEFAULT_QUERY_TIMEOUT = 30000;

export const insertRowAction = createAction({
  name: 'insert-row',
  displayName: 'Insert Row',
  description: 'Insert a row into a table.',
  auth: snowflakeAuth,
  props: {
    database: Property.Dropdown({
      displayName: 'Database',
      refreshers: [],
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        const authValue = auth as PiecePropValueSchema<typeof snowflakeAuth>;
        const { username, password, role, database, warehouse, account } =
          authValue;

        const connection = configureConnection(authValue);

        await connect(connection);

        return {
          disabled: false,
          options: [],
        };
      },
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
