import { createAction, Property } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../auth';
import { insertDocumentsOutputSchema } from '../output-schemas';
import { mongodbClient } from '../common/client';
import { mongodbProps } from '../common/props';

export const insertDocumentsAction = createAction({
  auth: mongodbAuth,
  name: 'insert_documents',
  classification: 'WRITE',
  displayName: 'Insert Documents',
  description: 'Insert one or more documents into a collection',
  audience: 'human',
  outputSchema: insertDocumentsOutputSchema,
  aiMetadata: { description: 'Inserts new documents into a MongoDB collection; accepts either a single document object or an array of documents. Use to add records. Not idempotent: each call creates new documents with fresh _id values, so repeating it appends duplicates.', idempotent: false },
  props: {
    database: mongodbProps.database({ required: false }),
    collection: mongodbProps.collection({ required: true }),
    documents: Property.Json({
      displayName: 'Documents',
      description: 'Document(s) to insert. Can be a single document object or an array of documents.',
      required: true,
    }),
  },
  async run(context) {
    const client = await mongodbClient.create({ auth: context.auth });

    try {
      if (!context.propsValue.collection) {
        throw new Error('Collection is required');
      }

      if (!context.propsValue.documents) {
        throw new Error('Documents are required');
      }

      const databaseName = context.propsValue.database || context.auth.props.database;
      if (!databaseName) {
        throw new Error('Database is required. Please specify it in the connection settings or in this action.');
      }
      const db = client.db(databaseName);
      const collection = db.collection(context.propsValue.collection);

      const documents = context.propsValue.documents;
      let result;

      if (Array.isArray(documents)) {
        if (documents.length === 0) {
          return { insertedCount: 0, insertedIds: [] };
        }
        result = await collection.insertMany(documents);
        return {
          insertedCount: result.insertedCount,
          insertedIds: result.insertedIds,
        };
      } else {
        result = await collection.insertOne(documents);
        return {
          insertedId: result.insertedId,
          acknowledged: result.acknowledged,
        };
      }
    } finally {
      await client.close();
    }
  },
});
