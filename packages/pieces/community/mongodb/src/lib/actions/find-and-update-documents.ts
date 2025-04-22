import { createAction, Property } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../..';
import { mongodbCommon, mongodbConnect } from '../common';

export default createAction({
  auth: mongodbAuth,
  name: 'find_and_update_documents',
  displayName: 'Find and Update Documents',
  description: 'Find documents and update them, returning the updated documents',
  props: {
    database: mongodbCommon.database,
    collection: mongodbCommon.collection(),
    filter: Property.Json({
      displayName: 'Filter',
      description: 'MongoDB query to select documents to update (e.g., {"status": "pending"})',
      required: true,
    }),
    update: Property.Json({
      displayName: 'Update',
      description: 'MongoDB update operations (e.g., {"$set": {"status": "completed"}})',
      required: true,
    }),
    upsert: Property.Checkbox({
      displayName: 'Upsert',
      description: 'Insert a document if no documents match the filter',
      required: false,
      defaultValue: false,
    }),
    returnUpdated: Property.Checkbox({
      displayName: 'Return Updated Documents',
      description: 'Return the documents after updates are applied',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const client = await mongodbConnect(context.auth);

    try {
      if (!context.propsValue.collection) {
        throw new Error('Collection is required');
      }

      if (!context.propsValue.filter) {
        throw new Error('Filter is required');
      }

      if (!context.propsValue.update) {
        throw new Error('Update is required');
      }

      const databaseName = context.propsValue.database || context.auth.database;
      if (!databaseName) {
        throw new Error('Database is required. Please specify it in the connection settings or in this action.');
      }
      const db = client.db(databaseName);
      const collection = db.collection(context.propsValue.collection);

      const filter = context.propsValue.filter;
      const update = context.propsValue.update;
      const upsert = context.propsValue.upsert || false;
      const returnUpdated = context.propsValue.returnUpdated !== false;

      const updateResult = await collection.updateMany(filter, update, { upsert });

      let documents: Record<string, unknown>[] = [];
      if (returnUpdated) {
        documents = await collection.find(filter).toArray();
      }

      return {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
        upsertedCount: updateResult.upsertedCount,
        upsertedId: updateResult.upsertedId,
        documents: returnUpdated ? documents : undefined,
      };
    } finally {
      await client.close();
    }
  },
});
