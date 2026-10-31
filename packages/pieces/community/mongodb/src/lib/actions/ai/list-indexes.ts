import { createAction } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';

export const listIndexesAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_list_indexes',
  displayName: 'List Indexes',
  description: 'List the indexes on a collection.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the indexes on a collection with their name, keys and options such as unique. Use it before Create Index to avoid duplicates, or to get the name Drop Index needs.',
    idempotent: true,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
  },
  async run(context) {
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const indexes = await client
        .db(databaseName)
        .collection(context.propsValue.collection)
        .listIndexes()
        .toArray();
      return { indexes, count: indexes.length };
    } finally {
      await client.close();
    }
  },
});
