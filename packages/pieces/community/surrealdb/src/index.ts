import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { runQuery } from './lib/actions/run-query';
import { newRow } from './lib/triggers/new-row';
import surrealClient from './lib/common';

export const surrealdbAuth = PieceAuth.CustomAuth({
  props: {
    url: Property.ShortText({
      displayName: 'Connection URL',
      required: true,
      description: 'Connection string, e.g. http://1.2.3.5:8000.',
    }),
    database: Property.ShortText({
      displayName: 'Database',
      description:
        'A string indicating the name of the database to connect to.',
      required: true,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      required: true,
      description:
        'As string indicating the namespace of the database to connect to.',
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
      description:
        'As string indicating the username of the database to connect to.',
    }),
    password: Property.ShortText({
      displayName: 'Password',
      required: true,
      description:
        'As string indicating the password of the database to connect to.',
    }),
  },
  required: true,
  validate: async ({ auth }) => {
    try {
      surrealClient.query(auth, 'INFO for db');
    } catch (e) {
      return {
        valid: false,
        error: JSON.stringify(e),
      };
    }
    return {
      valid: true,
    };
  },
});

export const surrealdb = createPiece({
  displayName: 'SurrealDB',
  description: "Multi Model Database",
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  logoUrl: 'https://cdn.activepieces.com/pieces/surrealdb.jpg',
  authors: ['maarteNNNN'],
  auth: surrealdbAuth,
  actions: [runQuery],
  triggers: [newRow],
});
