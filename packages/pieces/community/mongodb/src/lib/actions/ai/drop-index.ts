import { createAction, Property } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';
import { mongodbDropIndexOutputSchema } from '../../output-schemas';

export const dropIndexAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_drop_index',
  outputSchema: mongodbDropIndexOutputSchema,
  displayName: 'Drop Index',
  description: 'Remove an index from a collection.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Removes one index from a collection by name; documents are not touched. The name comes from List Indexes; the default "_id_" index cannot be dropped.',
    idempotent: false,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'Name of the index, e.g. "email_1". Use List Indexes to find it.',
      required: true,
    }),
  },
  async run(context) {
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      return await client
        .db(databaseName)
        .collection(context.propsValue.collection)
        .dropIndex(context.propsValue.indexName);
    } finally {
      await client.close();
    }
  },
});
