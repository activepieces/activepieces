import {
  DynamicPropsValue,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../..';
import snowflake from 'snowflake-sdk';

const DEFAULT_APPLICATION_NAME = 'ActivePieces';
const DEFAULT_QUERY_TIMEOUT = 30000;

function formatPrivateKey(privateKey: string): string {
  const privateKeyLines = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .trim()
    .split(' ');

  return [
    '-----BEGIN PRIVATE KEY-----',
    ...privateKeyLines,
    '-----END PRIVATE KEY-----',
  ].join('\n');
}

export function configureConnection(
  auth: PiecePropValueSchema<typeof snowflakeAuth>,
  application = DEFAULT_APPLICATION_NAME,
  timeout = DEFAULT_QUERY_TIMEOUT
) {
  const connectionOptions: snowflake.ConnectionOptions = {
    application: application,
    timeout: timeout,
    username: auth.username,
    role: auth.role,
    database: auth.database,
    warehouse: auth.warehouse,
    account: auth.account,
  };

  if (auth.privateKey) {
    connectionOptions.privateKey = formatPrivateKey(auth.privateKey);
    connectionOptions.authenticator = 'SNOWFLAKE_JWT';
  } else {
    connectionOptions.password = auth.password;
  }

  return snowflake.createConnection(connectionOptions);
}

export async function connect(conn: snowflake.Connection) {
  return await new Promise<void>((resolve, reject) => {
    conn.connect((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export async function destroy(conn: snowflake.Connection) {
  return await new Promise<void>((resolve, reject) => {
    conn.destroy((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export async function execute(
  conn: snowflake.Connection,
  sqlText: string,
  binds: snowflake.Binds
) {
  return await new Promise<any[] | undefined>((resolve, reject) => {
    conn.execute({
      sqlText,
      binds,
      complete: (error, _, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    });
  });
}

export const snowflakeCommonProps = {
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

      const connection = configureConnection(authValue);

      await connect(connection);

      const response = await execute(connection, 'SHOW DATABASES', []);

      await destroy(connection);

      return {
        disabled: false,
        options: response
          ? response.map((db: any) => {
              return {
                label: db.name,
                value: db.name,
              };
            })
          : [],
      };
    },
  }),
  schema: Property.Dropdown({
    displayName: 'Schema',
    refreshers: ['database'],
    required: true,
    options: async ({ auth, database }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      if (!database) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select database first',
        };
      }

      const authValue = auth as PiecePropValueSchema<typeof snowflakeAuth>;

      const connection = configureConnection(authValue);

      await connect(connection);

      const response = await execute(
        connection,
        `SHOW SCHEMAS IN DATABASE ${database}`,
        []
      );

      await destroy(connection);

      return {
        disabled: false,
        options: response
          ? response.map((schema: any) => {
              return {
                label: schema.name,
                value: schema.name,
              };
            })
          : [],
      };
    },
  }),
  table: Property.Dropdown({
    displayName: 'Table',
    refreshers: ['database', 'schema'],
    required: true,
    options: async ({ auth, database, schema }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      if (!database) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select database first',
        };
      }
      if (!schema) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select schema first',
        };
      }

      const authValue = auth as PiecePropValueSchema<typeof snowflakeAuth>;

      const connection = configureConnection(authValue);

      await connect(connection);

      const response = await execute(
        connection,
        `SHOW TABLES IN SCHEMA ${database}.${schema}`,
        []
      );

      await destroy(connection);

      return {
        disabled: false,
        options: response
          ? response.map((table: any) => {
              return {
                label: table.name,
                value: `${database}.${schema}.${table.name}`,
              };
            })
          : [],
      };
    },
  }),
  table_column_values: Property.DynamicProperties({
    displayName: 'Rows',
    required: true,
    refreshers: ['database', 'schema', 'table'],
    props: async ({ auth, table }) => {
      if (!auth) return {};
      if (!table) return {};

      const authValue = auth as PiecePropValueSchema<typeof snowflakeAuth>;

      const connection = configureConnection(authValue);
      await connect(connection);
      const response = await execute(connection, `DESCRIBE TABLE ${table}`, []);
      await destroy(connection);

      const fields: DynamicPropsValue = {};

      if (response) {
        for (const column of response) {
          fields[column.name] = Property.ShortText({
            displayName: column.name,
            required: false,
          });
        }
      }

      return fields;
    },
  }),
};
