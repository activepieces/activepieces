import {
  DynamicPropsValue,
  DropdownState,
  Property,
} from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import { snowflakeAuth } from '../auth';
import snowflake from 'snowflake-sdk';

const DEFAULT_APPLICATION_NAME = 'ActivePieces';
const DEFAULT_QUERY_TIMEOUT = 30000;

export type SnowflakeAuthValue =
  | {
      type: AppConnectionType.OAUTH2;
      access_token: string;
      props: {
        account: string;
        database?: string;
        warehouse?: string;
        role?: string;
      };
    }
  | {
      type: AppConnectionType.CUSTOM_AUTH;
      props: {
        account: string;
        username: string;
        password?: string;
        privateKey?: string;
        privateKeyPassphrase?: string;
        database?: string;
        role?: string;
        warehouse?: string;
      };
    };

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
  auth: SnowflakeAuthValue,
  application = DEFAULT_APPLICATION_NAME,
  timeout = DEFAULT_QUERY_TIMEOUT
) {
  if (auth.type === AppConnectionType.OAUTH2) {
    return snowflake.createConnection({
      account: auth.props.account,
      authenticator: 'OAUTH',
      token: auth.access_token,
      database: auth.props.database,
      warehouse: auth.props.warehouse,
      role: auth.props.role,
      application,
      timeout,
    });
  }

  const {
    account,
    username,
    password,
    privateKey,
    privateKeyPassphrase,
    database,
    role,
    warehouse,
  } = auth.props;

  const connectionOptions: snowflake.ConnectionOptions = {
    account,
    username,
    role,
    database,
    warehouse,
    application,
    timeout,
  };

  if (privateKey) {
    connectionOptions.privateKey = formatPrivateKey(privateKey);
    connectionOptions.authenticator = 'SNOWFLAKE_JWT';
    if (privateKeyPassphrase) {
      connectionOptions.privateKeyPass = privateKeyPassphrase;
    }
  } else {
    connectionOptions.password = password;
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
    auth: snowflakeAuth,
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

      const connection = configureConnection(auth as SnowflakeAuthValue);
      await connect(connection);
      const response = await execute(connection, 'SHOW DATABASES', []);
      await destroy(connection);

      return {
        disabled: false,
        options: response
          ? response.map((db: Record<string, unknown>) => ({
              label: db['name'] as string,
              value: db['name'] as string,
            }))
          : [],
      };
    },
  }),
  schema: Property.Dropdown({
    auth: snowflakeAuth,
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

      const connection = configureConnection(auth as SnowflakeAuthValue);
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
          ? response.map((schema: Record<string, unknown>) => ({
              label: schema['name'] as string,
              value: schema['name'] as string,
            }))
          : [],
      };
    },
  }),
  table: Property.Dropdown({
    auth: snowflakeAuth,
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

      const connection = configureConnection(auth as SnowflakeAuthValue);
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
          ? response.map((table: Record<string, unknown>) => ({
              label: table['name'] as string,
              value: `${database}.${schema}.${table['name']}`,
            }))
          : [],
      };
    },
  }),
  table_column_values: Property.DynamicProperties({
    auth: snowflakeAuth,
    displayName: 'Rows',
    required: true,
    refreshers: ['database', 'schema', 'table'],
    props: async ({ auth, table }) => {
      if (!auth) return {};
      if (!table) return {};

      const connection = configureConnection(auth as SnowflakeAuthValue);
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
  table_update_values: Property.DynamicProperties({
    auth: snowflakeAuth,
    displayName: 'Columns to Update',
    description:
      'Only filled columns will be updated. Leave a column empty to keep its existing value.',
    required: true,
    refreshers: ['database', 'schema', 'table'],
    props: async ({ auth, table }) => {
      if (!auth) return {};
      if (!table) return {};

      const connection = configureConnection(auth as SnowflakeAuthValue);
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

export async function getTableColumnOptions(
  auth: SnowflakeAuthValue,
  table: string
): Promise<DropdownState<string>> {
  const connection = configureConnection(auth);
  await connect(connection);
  const response = await execute(connection, `DESCRIBE TABLE ${table}`, []);
  await destroy(connection);
  return {
    disabled: false,
    options: response
      ? (response as { name: string }[]).map((col) => ({
          label: col.name,
          value: col.name,
        }))
      : [],
  };
}
