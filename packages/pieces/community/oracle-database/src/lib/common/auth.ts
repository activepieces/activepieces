import {
  PieceAuth,
  Property,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import oracledb from 'oracledb';
import fs from 'fs';

const ORACLE_BASE_DIR = '/opt/oracle/instantclient_21_13';

function getOracleClientLibDir(): string | null {
  if (!fs.existsSync(ORACLE_BASE_DIR)) return null;
  return ORACLE_BASE_DIR;
}

const oracleClientLibDir = getOracleClientLibDir();

if (oracleClientLibDir) {
  try {
    oracledb.initOracleClient({ libDir: oracleClientLibDir });
    console.log(`Oracle Instant Client loaded from ${oracleClientLibDir}. Thick mode active.`);
  } catch (e) {
    const msg = (e as Error)?.message ?? '';
    if (!msg.includes('NJS-077')) {
      console.error('Oracle Instant Client failed to load:', msg);
    }
  }
} else {
  console.log('Oracle Instant Client not found at /opt/oracle. Running in Thin mode.');
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