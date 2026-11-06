import { createAction } from '@activepieces/pieces-framework';
import { BSON } from 'mongodb';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';
import { mongodbCountDocumentsOutputSchema } from '../../output-schemas';

export const countDocumentsAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_count_documents',
  outputSchema: mongodbCountDocumentsOutputSchema,
  displayName: 'Count Documents',
  description: 'Count the documents in a collection that match a filter.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Returns the exact number of documents in a collection that match a filter, without returning the documents. Pick it over Find Documents when only the number matters. The collection comes from List Collections.',
    idempotent: true,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
    filter: mongodbAiProps.filter({ required: false }),
  },
  async run(context) {
    const filter: Document = BSON.EJSON.deserialize(context.propsValue.filter ?? {});
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const count = await client
        .db(databaseName)
        .collection(context.propsValue.collection)
        .countDocuments(filter);
      return { count };
    } finally {
      await client.close();
    }
  },
});
