import { createAction, Property } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../..';
import { mongodbCommon, mongodbConnect } from '../common';

export default createAction({
  auth: mongodbAuth,
  name: 'update_documents',
  displayName: 'Update Documents',
  description: 'Update multiple documents in a collection',
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

      const result = await collection.updateMany(filter, update, { upsert });

      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
        upsertedId: result.upsertedId,
      };
    } finally {
      await client.close();
    }
  },
});
