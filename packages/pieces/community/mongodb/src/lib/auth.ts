import {
  AppConnectionType,
  PieceAuth,
  Property,
  tryCatch,
} from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import * as z from 'zod/mini';
import { mongodbClient } from './common/client';
import type { MongodbAuthValue } from './common/types';

export const mongodbAuth = PieceAuth.CustomAuth({
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() => validateAuth({ props: auth }));
    if (error) {
      return {
        valid: false,
        error: error?.message,
      };
    }
    return {
      valid: true,
    };
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

async function validateAuth({ props }: { props: MongodbAuthValue['props'] }): Promise<void> {
  await propsValidation.validateZod(props, {
    host: z.string().check(z.minLength(1)),
    useAtlasUrl: z.boolean(),
    database: z.optional(z.string()),
    username: z.string().check(z.minLength(1)),
    password: z.optional(z.string()),
    authSource: z.optional(z.string()),
  });

  const client = await mongodbClient.create({
    auth: { type: AppConnectionType.CUSTOM_AUTH, props },
  });

  await client.db('admin').command({ ping: 1 });

  await client.close();
}
