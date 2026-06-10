import { createAction, Property } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../..';
import { mongodbCommon, mongodbConnect } from '../common';

export default createAction({
  auth: mongodbAuth,
  name: 'delete_documents',
  displayName: 'Delete Documents',
  description: 'Delete documents from a collection',
  audience: 'both',
  aiMetadata: { description: 'Removes every document matching a filter from a MongoDB collection via deleteMany. Use to delete records in bulk; an empty filter would match and delete all documents in the collection, so scope the filter carefully. The filter is required. Mutating and destructive; repeating the call deletes whatever now matches, so it is not idempotent.', idempotent: false },
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

      const databaseName = context.propsValue.database || context.auth.props.database;
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
