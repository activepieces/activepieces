import { createAction, Property } from '@activepieces/pieces-framework';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';

export const createIndexAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_create_index',
  displayName: 'Create Index',
  description: 'Create an index on a collection.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates an index on one or more fields of a collection and returns its name. Repeating the call with the same keys and options is a no-op; the same keys with different options fail. A unique index fails if existing documents already hold duplicate values.',
    idempotent: true,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
    keys: Property.Json({
      displayName: 'Keys',
      description: 'Fields and direction, e.g. {"email": 1} or {"lastName": 1, "createdAt": -1}. Use "text" for a text index.',
      required: true,
    }),
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'Name for the index. Defaults to a name MongoDB builds from the keys, e.g. "email_1".',
      required: false,
    }),
    unique: Property.StaticDropdown({
      displayName: 'Unique',
      description: 'Whether the indexed values must be unique. Defaults to false.',
      required: false,
      options: {
        options: [
          { label: 'True', value: 'true' },
          { label: 'False', value: 'false' },
        ],
      },
    }),
  },
  async run(context) {
    const { indexName, unique } = context.propsValue;
    const keys: Document = context.propsValue.keys;
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const name = await client
        .db(databaseName)
        .collection(context.propsValue.collection)
        .createIndex(keys, {
          ...(indexName ? { name: indexName } : {}),
          ...(unique ? { unique: unique === 'true' } : {}),
        });
      return { indexName: name };
    } finally {
      await client.close();
    }
  },
});
