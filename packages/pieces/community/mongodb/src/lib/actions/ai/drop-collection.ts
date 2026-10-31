import { createAction } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';
import { mongodbDropCollectionOutputSchema } from '../../output-schemas';

export const dropCollectionAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_drop_collection',
  outputSchema: mongodbDropCollectionOutputSchema,
  displayName: 'Drop Collection',
  description: 'Permanently delete a collection with all its documents and indexes.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a collection with every document and index in it; there is no undo. Use Delete Documents instead to remove only some documents. The collection comes from List Collections.',
    idempotent: false,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
  },
  async run(context) {
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const result = await client.db(databaseName).command({ drop: context.propsValue.collection });
      return { ...result, database: databaseName, collection: context.propsValue.collection };
    } finally {
      await client.close();
    }
  },
});
