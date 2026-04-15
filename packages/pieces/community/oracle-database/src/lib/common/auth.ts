import {
  PieceAuth,
  Property,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import oracledb from 'oracledb';
import { ensureOracleClient } from './thick-mode';

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
    thickMode: Property.Checkbox({
      displayName: 'Thick Mode',
      description:
        'Enable to support older Oracle Database versions (11g, 10g password verifiers). ' +
        'Oracle Instant Client will be downloaded and installed automatically if not already present.',
      required: false,
      defaultValue: false,
    }),
  },

  validate: async ({ auth }) => {
    let connection: oracledb.Connection | undefined;
    const typedAuth = auth as StaticPropsValue<(typeof oracleDbAuth)['props']>;
    const logs: string[] = [];

    try {
      let connectString: string | undefined;

      if (typedAuth.connectionType === 'serviceName') {
        if (!typedAuth.host || !typedAuth.port || !typedAuth.serviceName) {
          return {
            valid: false,
            error:
              'Host, Port, and Service Name are required for this connection type.',
          };
        }
        connectString = `${typedAuth.host}:${typedAuth.port}/${typedAuth.serviceName}`;
        logs.push(`[oracle] Connection type: serviceName → ${connectString}`);
      } else {
        if (!typedAuth.connectionString) {
          return {
            valid: false,
            error: 'Connection String is required for this connection type.',
          };
        }
        connectString = typedAuth.connectionString;
        logs.push(`[oracle] Connection type: connectionString → ${connectString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      }

      logs.push(`[oracle] Thick mode: ${typedAuth.thickMode === true}`);
      await ensureOracleClient({ thickMode: typedAuth.thickMode === true, logs });
      logs.push('[oracle] Oracle client ready. Opening connection...');

      connection = await oracledb.getConnection({
        user: typedAuth.user,
        password: typedAuth.password,
        connectString: connectString,
      });
      logs.push('[oracle] Connection established successfully.');
      console.log(logs.join('\n'));
      return { valid: true };
    } catch (e) {
      logs.push(`[oracle] Error: ${(e as Error)?.message ?? 'Unknown error'}`);
      return {
        valid: false,
        error: `Connection failed. Debug log:\n${logs.join('\n')}`,
      };
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch {
          // ignore
        }
      }
    }
  },
});

export type OracleDbAuth = StaticPropsValue<typeof oracleDbAuth.props>;
