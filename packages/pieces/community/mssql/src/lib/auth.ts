import {
  AppConnectionType,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { mssqlConnect } from './common';

export const mssqlAuth = PieceAuth.CustomAuth({
  props: {
    connection_string: Property.LongText({
      displayName: 'Connection String',
      description:
        'Azure SQL only. In the Azure portal open your database, choose Connection strings, and copy the ADO.NET (SQL authentication) string — not one of the Active Directory variants. Replace the {your_password} placeholder with your password, and if your password contains a semicolon, wrap it in double quotes like Password="my;pass"; otherwise it is cut off at the semicolon. When this is filled in, the host, port, database, username, password and encryption fields below are ignored — only CA Certificate and Minimum TLS Version still apply, since a connection string cannot express them.',
      required: false,
    }),
    host: Property.ShortText({
      displayName: 'Host',
      description:
        'The hostname or address of the SQL Server, e.g. sql.example.com. Use the host and port below rather than a named instance, since instance lookup needs UDP port 1434.',
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
        'Encrypt the connection with TLS. Required by Azure SQL. Turn this off only for an on-premise server that has no TLS configured at all.',
      required: true,
      defaultValue: true,
    }),
    trust_server_certificate: Property.Checkbox({
      displayName: 'Trust Server Certificate',
      description:
        'Skip verification of the server certificate. Turn this on for an on-premise server using a self-signed certificate. Leave it off for Azure SQL, or whenever you supply a CA certificate below.',
      required: true,
      defaultValue: false,
    }),
    certificate: Property.LongText({
      displayName: 'CA Certificate',
      description:
        'Optional. Paste a CA certificate in PEM format to verify a self-signed server certificate properly instead of trusting it blindly.',
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
      const pool = await mssqlConnect({
        type: AppConnectionType.CUSTOM_AUTH,
        props: auth,
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
