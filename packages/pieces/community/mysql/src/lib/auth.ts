import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const mysqlAuth = PieceAuth.CustomAuth({
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      required: true,
      description: "The server's hostname or IP address.",
      placeholder: 'db.example.com',
    }),
    port: Property.Number({
      displayName: 'Port',
      defaultValue: 3306,
      description: 'The port the server listens on, usually 3306.',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'Username',
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
      description: 'The database to use. Only Run Query works without one.',
      required: false,
    }),
  },
  required: true,
});
