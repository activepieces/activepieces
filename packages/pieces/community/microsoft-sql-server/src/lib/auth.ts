import {
  AppConnectionType,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { mssqlCommon } from './common';

export const mssqlAuth = PieceAuth.CustomAuth({
  description:
    'For Azure SQL, use the Connection String field: in the portal open your database, choose Connection strings, and copy the ADO.NET (SQL authentication) one — not an Active Directory variant. Replace the {your_password} placeholder, and quote a password containing a semicolon: Password="my;pass";.',
  props: {
    connection_string: Property.LongText({
      displayName: 'Connection String',
      description:
        'Azure SQL only. When set, the fields below are ignored except CA Certificate and Minimum TLS Version.',
      required: false,
    }),
    host: Property.ShortText({
      displayName: 'Host',
      description:
        'The hostname or address of the SQL Server. Use Host and Port rather than a named instance, which needs UDP port 1434.',
      required: false,
    }),
    port: Property.Number({
      displayName: 'Port',
      description: 'The port the SQL Server listens on.',
      defaultValue: 1433,
      required: false,
    }),
    database: Property.ShortText({
      displayName: 'Database',
      description: 'The name of the database to connect to.',
      required: false,
    }),
    user: Property.ShortText({
      displayName: 'Username',
      description:
        'The SQL Server login to authenticate as. On Azure SQL this is usually user@servername.',
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'The password for the login above.',
      required: false,
    }),
    encrypt: Property.Checkbox({
      displayName: 'Encrypt Connection',
      description:
        'Encrypt the connection with TLS. Required by Azure SQL; turn off only for an on-premise server with no TLS configured.',
      required: true,
      defaultValue: true,
    }),
    trust_server_certificate: Property.Checkbox({
      displayName: 'Trust Server Certificate',
      description:
        'Skip server certificate verification, for an on-premise server with a self-signed certificate. Leave off for Azure SQL or when a CA certificate is supplied below.',
      required: true,
      defaultValue: false,
    }),
    certificate: Property.LongText({
      displayName: 'CA Certificate',
      description: 'Optional CA certificate (PEM) to verify a self-signed server certificate.',
      required: false,
    }),
    min_tls_version: Property.StaticDropdown({
      displayName: 'Minimum TLS Version',
      description:
        'Optional. Lower this only to reach an older server such as SQL Server 2012 that cannot negotiate TLS 1.2.',
      required: false,
      options: {
        options: [
          { label: 'TLS 1.3', value: 'TLSv1.3' },
          { label: 'TLS 1.2', value: 'TLSv1.2' },
          { label: 'TLS 1.1', value: 'TLSv1.1' },
          { label: 'TLS 1.0', value: 'TLSv1' },
        ],
      },
    }),
  },
  required: true,
  validate: async ({ auth }) => {
    try {
      const pool = await mssqlCommon.connect({
        auth: {
          type: AppConnectionType.CUSTOM_AUTH,
          props: auth,
        },
      });
      try {
        await pool.request().query('SELECT 1');
      } finally {
        await pool.close();
      }
    } catch (e) {
      return {
        valid: false,
        error: e instanceof Error ? e.message : JSON.stringify(e),
      };
    }
    return {
      valid: true,
    };
  },
});
