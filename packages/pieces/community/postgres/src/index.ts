import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { runQuery } from './lib/actions/run-query';
import { newRow } from './lib/triggers/new-row';
import { pgClient } from './lib/common';

export const postgresAuth = PieceAuth.CustomAuth({
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      required: true,
      description:
        ' A string indicating the hostname of the PostgreSQL server to connect to.',
    }),
    port: Property.Number({
      displayName: 'Port',
      defaultValue: 5432,
      description:
        'An integer indicating the port of the PostgreSQL server to connect to.',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'User',
      required: true,
      description:
        'A string indicating the user to authenticate as when connecting to the PostgreSQL server.',
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description:
        'A string indicating the password to use for authentication.',
      required: true,
    }),
    database: Property.ShortText({
      displayName: 'Database',
      description:
        'A string indicating the name of the database to connect to.',
      required: true,
    }),
    enable_ssl: Property.Checkbox({
      displayName: 'Enable SSL',
      description: 'Connect to the postgres database over SSL',
      required: true,
      defaultValue: true,
    }),
    reject_unauthorized: Property.Checkbox({
      displayName: 'Verify server certificate',
      description:
        'Verify the server certificate against trusted CAs or a CA provided in the certificate field below. This will fail if the database server is using a self signed certificate.',
      required: true,
      defaultValue: false,
    }),
    certificate: Property.LongText({
      displayName: 'Certificate',
      description:
        'The CA certificate to use for verification of server certificate.',
      defaultValue: '',
      required: false,
    }),
  },
  required: true,
  validate: async ({ auth }) => {
    try {
      const client = await pgClient(auth);
      await client.end();
    }
    catch (e) {
      return {
        valid: false,
        error: JSON.stringify(e)
      };
    }
    return {
      valid: true,
    };
  }
});

export const postgres = createPiece({
  displayName: 'Postgres',
  description: "The world's most advanced open-source relational database",
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  logoUrl: 'https://cdn.activepieces.com/pieces/postgres.png',
  authors: ["AbdullahBitar", "Willianwg", "dentych", "kishanprmr", "AbdulTheActivePiecer", "khaledmashaly", "abuaboud"],
  auth: postgresAuth,
  actions: [runQuery],
  triggers: [newRow],
});
