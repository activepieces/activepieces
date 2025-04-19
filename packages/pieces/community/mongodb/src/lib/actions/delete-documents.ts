import { createAction, Property } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../..';
import { mongodbCommon, mongodbConnect } from '../common';

export default createAction({
  auth: mongodbAuth,
  name: 'delete_documents',
  displayName: 'Delete Documents',
  description: 'Delete documents from a collection',
  props: {
    database: mongodbCommon.database,
    collection: mongodbCommon.collection(),
    filter: Property.Json({
      displayName: 'Filter',
      description: 'MongoDB query to select documents to delete (e.g., {"status": "archived"})',
      required: true,
    }),
  },
  async run(context) {
    const client = await mongodbConnect(context.auth);

    try {
      if (!context.propsValue.collection) {
        throw new Error('Collection is required');
      }

      const databaseName = context.propsValue.database || context.auth.database;
      if (!databaseName) {
        throw new Error('Database is required. Please specify it in the connection settings or in this action.');
      }
      const db = client.db(databaseName);
      const collection = db.collection(context.propsValue.collection);

      const filter = context.propsValue.filter || {};

      const result = await collection.deleteMany(filter);

      return {
        deletedCount: result.deletedCount,
      };
    } finally {
      await client.close();
    }
  },
});
