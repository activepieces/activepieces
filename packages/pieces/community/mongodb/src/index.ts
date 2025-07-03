import {
  PiecePropValueSchema,
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

import actions from './lib/actions';
import { mongodbConnect } from './lib/common';

export const mongodbAuth = PieceAuth.CustomAuth({
  validate: async ({ auth }) => {
    try {
      await validateAuth(auth);
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: (e as Error)?.message,
      };
    }
  },
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      required: true,
      description:
        'The hostname or address of the MongoDB server (e.g., localhost:27017 or cluster.example.mongodb.net)',
    }),
    useAtlasUrl: Property.Checkbox({
      displayName: 'Use MongoDB Atlas URL Format',
      description:
        'Enable this if connecting to MongoDB Atlas (uses mongodb+srv:// protocol)',
      required: true,
      defaultValue: false,
    }),
    database: Property.ShortText({
      displayName: 'Database',
      required: false,
      description:
        'The MongoDB database to connect to (can be specified per action if left empty)',
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
      description: 'The username to use for connecting to the MongoDB server',
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'The password to use to identify at the MongoDB server',
      required: true,
    }),
    authSource: Property.ShortText({
      displayName: 'Auth Source',
      required: false,
      description: 'The database to authenticate against (default: admin)',
      defaultValue: 'admin',
    }),
  },
  required: true,
});

const validateAuth = async (auth: PiecePropValueSchema<typeof mongodbAuth>) => {
  await propsValidation.validateZod(auth, {
    host: z.string().min(1),
    useAtlasUrl: z.boolean(),
    database: z.string().optional(),
    username: z.string().min(1),
    password: z.string().optional(),
    authSource: z.string().optional(),
  });

  const client = await mongodbConnect(auth);

  await client.db('admin').command({ ping: 1 });

  await client.close();

  console.log('MongoDB validation successful');
};

export const mongodb = createPiece({
  displayName: 'MongoDB',
  auth: mongodbAuth,
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  logoUrl: 'https://cdn.activepieces.com/pieces/mongodb.png',
  authors: ['denieler'],
  actions,
  triggers: [],
});
