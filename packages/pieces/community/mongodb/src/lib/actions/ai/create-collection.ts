import { createAction } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';

export const createCollectionAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_create_collection',
  displayName: 'Create Collection',
  description: 'Create a new collection in a database.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates an empty collection. It fails when a collection with that name already exists, so check List Collections first. Inserting into a missing collection also creates it, so this is only needed for an empty one.',
    idempotent: false,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({
      required: true,
      description: 'Name of the new collection, e.g. "orders".',
    }),
  },
  async run(context) {
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const result = await client.db(databaseName).command({ create: context.propsValue.collection });
      return { ...result, database: databaseName, collection: context.propsValue.collection };
    } finally {
      await client.close();
    }
  },
});
