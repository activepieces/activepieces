import { createAction, Property } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../..';
import { mongodbCommon, mongodbConnect } from '../common';

export default createAction({
  auth: mongodbAuth,
  name: 'insert_documents',
  displayName: 'Insert Documents',
  description: 'Insert one or more documents into a collection',
  props: {
    database: mongodbCommon.database,
    collection: mongodbCommon.collection(),
    documents: Property.Json({
      displayName: 'Documents',
      description: 'Document(s) to insert. Can be a single document object or an array of documents.',
      required: true,
    }),
  },
  async run(context) {
    const client = await mongodbConnect(context.auth);

    try {
      if (!context.propsValue.collection) {
        throw new Error('Collection is required');
      }

      if (!context.propsValue.documents) {
        throw new Error('Documents are required');
      }

      const databaseName = context.propsValue.database || context.auth.database;
      if (!databaseName) {
        throw new Error('Database is required. Please specify it in the connection settings or in this action.');
      }
      const db = client.db(databaseName);
      const collection = db.collection(context.propsValue.collection);

      const documents = context.propsValue.documents;
      let result;

      if (Array.isArray(documents)) {
        // Insert many documents
        if (documents.length === 0) {
          return { insertedCount: 0, insertedIds: [] };
        }
        result = await collection.insertMany(documents);
        return {
          insertedCount: result.insertedCount,
          insertedIds: result.insertedIds,
        };
      } else {
        // Insert a single document
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
