import { createAction } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';

export const listCollectionsAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_list_collections',
  displayName: 'List Collections',
  description: 'List the collections in a database.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the collections and views in a database, with their type and options. Use it to find a collection name for the other MongoDB actions; the database comes from List Databases or the connection.',
    idempotent: true,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
  },
  async run(context) {
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const collections = await client.db(databaseName).listCollections().toArray();
      return { collections, count: collections.length };
    } finally {
      await client.close();
    }
  },
});
