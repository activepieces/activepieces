import { createAction, Property } from '@activepieces/pieces-framework';
import { BSON } from 'mongodb';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';
import { insertDocumentsOutputSchema } from '../../output-schemas';

export const insertDocumentsAiAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_insert_documents',
  displayName: 'Insert Documents',
  description: 'Insert one or more documents into a collection.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: insertDocumentsOutputSchema,
  aiMetadata: {
    description: 'Inserts one document (an object) or several (an array of objects) into a collection, creating the collection if it does not exist, and returns the new _id values. Each call adds new documents, so repeating it creates duplicates.',
    idempotent: false,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
    documents: Property.Json({
      displayName: 'Documents',
      description: 'One document object, or an array of document objects, e.g. [{"name": "Ada"}, {"name": "Alan"}]. Use {"$date": "<ISO date>"} for a date and {"$oid": "<24-hex id>"} for an ObjectId.',
      required: true,
    }),
  },
  async run(context) {
    const documents: Document | Document[] = BSON.EJSON.deserialize(context.propsValue.documents);
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const collection = client.db(databaseName).collection(context.propsValue.collection);
      if (Array.isArray(documents)) {
        if (documents.length === 0) {
          return { insertedCount: 0, insertedIds: {} };
        }
        const result = await collection.insertMany(documents);
        return { insertedCount: result.insertedCount, insertedIds: result.insertedIds };
      }
      const result = await collection.insertOne(documents);
      return { insertedId: result.insertedId, acknowledged: result.acknowledged };
    } finally {
      await client.close();
    }
  },
});
