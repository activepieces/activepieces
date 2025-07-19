import {
  PieceAuth,
  Property,
  createPiece,
} from '@ensemble/pieces-framework';
import { PieceCategory } from '@ensemble/shared';
import actions from './lib/actions';

export const mysqlAuth = PieceAuth.CustomAuth({
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      required: true,
      description: 'The hostname or address of the mysql server',
    }),
    port: Property.Number({
      displayName: 'Port',
      defaultValue: 3306,
      description: 'The port to use for connecting to the mysql server',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'Username',
      required: true,
      description: 'The username to use for connecting to the mysql server',
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'The password to use to identify at the mysql server',
      required: true,
    }),
    database: Property.ShortText({
      displayName: 'Database',
      description: 'The name of the database to use. Required if you are not using the "Execute Query" Action',
      required: false,
    }),
  },
  required: true,
});

export const mysql = createPiece({
  displayName: 'MySQL',
  description: "The world's most popular open-source database",

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/mysql.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ["JanHolger","kishanprmr","khaledmashaly","abuaboud"],
  auth: mysqlAuth,
  actions,
  triggers: [],
});
