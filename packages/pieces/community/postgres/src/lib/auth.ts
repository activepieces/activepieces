import { AppConnectionType, PieceAuth, Property } from '@activepieces/pieces-framework';
import { pgClient } from './client';

export const postgresAuth = PieceAuth.CustomAuth({
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      required: true,
      description: "The server's hostname or IP address.",
      placeholder: 'db.example.com',
    }),
    port: Property.Number({
      displayName: 'Port',
      defaultValue: 5432,
      description: 'The port the server listens on, usually 5432.',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'User',
      required: true,
      description: 'The database user to sign in as.',
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'The password for that user.',
      required: true,
    }),
    database: Property.ShortText({
      displayName: 'Database',
      description: 'The name of the database to connect to.',
      required: true,
    }),
    enable_ssl: Property.Checkbox({
      displayName: 'Enable SSL',
      description: 'Encrypt the connection. Most hosted databases require it.',
      required: true,
      defaultValue: true,
    }),
    reject_unauthorized: Property.Checkbox({
      displayName: 'Verify Server Certificate',
      description:
        "Check the server's certificate. Self-signed servers need a CA below.",
      required: true,
      defaultValue: false,
    }),
    certificate: Property.LongText({
      displayName: 'Certificate',
      description:
        'The CA certificate (PEM) to trust when verifying the server.',
      placeholder: '-----BEGIN CERTIFICATE-----',
      defaultValue: '',
      required: false,
    }),
  },
  required: true,
  validate: async ({ auth }) => {
    try {
      const client = await pgClient({
        type: AppConnectionType.CUSTOM_AUTH,
        props: auth,
      });
      await client.end();
    }
    catch (e) {
      return {
        valid: false,
        error: e instanceof Error && e.message ? e.message : JSON.stringify(e)
      };
    }
    return {
      valid: true,
    };
  }
});
