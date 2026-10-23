import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import actions from './lib/actions';

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

export const mysql = createPiece({
  displayName: 'MySQL',
  description: "The world's most popular open-source database",

  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/mysql.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ["JanHolger","kishanprmr","khaledmashaly","abuaboud"],
  auth: mysqlAuth,
  actions,
  triggers: [],
});
