import {
  PieceAuth,
  Property,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import oracledb from 'oracledb';

try {
  oracledb.initOracleClient();
} catch (e) {
  console.log('Oracle client already initialized or failed to initialize.');
}

export const oracleDbAuth = PieceAuth.CustomAuth({
  description: `Connect to Oracle Database using either Service Name (host/port/service) or a full connection string.`,
  required: true,
  props: {
    connectionType: Property.StaticDropdown({
      displayName: 'Connection Type',
      description: 'How you want to connect',
      required: true,
      options: {
        options: [
          { label: 'Service Name', value: 'serviceName' },
          { label: 'Connection String', value: 'connectionString' },
        ],
      },
      defaultValue: 'serviceName',
    }),
    host: Property.ShortText({
      displayName: 'Host',
      description: 'Database server hostname or IP',
      required: false,
    }),
    port: Property.Number({
      displayName: 'Port',
      description: 'Database port',
      required: false,
      defaultValue: 1521,
    }),
    serviceName: Property.ShortText({
      displayName: 'Service Name',
      description: 'Oracle service name',
      required: false,
    }),
    connectionString: Property.LongText({
      displayName: 'Connection String',
      description: 'Full connection string (e.g., host:port/serviceName)',
      required: false,
    }),
    user: Property.ShortText({
      displayName: 'Username',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
    }),
  },

  validate: async ({ auth }) => {
    let connection: oracledb.Connection | undefined;
    const typedAuth = auth as StaticPropsValue<(typeof oracleDbAuth)['props']>;

    try {
      let connectString: string | undefined;

      if (typedAuth.connectionType === 'serviceName') {
        if (!typedAuth.host || !typedAuth.port || !typedAuth.serviceName) {
          return {
            valid: false,
            error: 'Host, Port, and Service Name are required for this connection type.',
          };
        }
        connectString = `${typedAuth.host}:${typedAuth.port}/${typedAuth.serviceName}`;
      } else {
        if (!typedAuth.connectionString) {
          return {
            valid: false,
            error: 'Connection String is required for this connection type.',
          };
        }
        connectString = typedAuth.connectionString;
      }

      connection = await oracledb.getConnection({
        user: typedAuth.user,
        password: typedAuth.password,
        connectString: connectString,
      });

      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: (e as Error)?.message || 'Unknown connection error.',
      };
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (e) {
          console.error('Failed to close Oracle DB connection:', e);
        }
      }
    }
  },
});

export type OracleDbAuth = StaticPropsValue<typeof oracleDbAuth.props>;