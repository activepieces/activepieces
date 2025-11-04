import { createAction, Property } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../..';
import { mongodbCommon, mongodbConnect } from '../common';

export default createAction({
  auth: mongodbAuth,
  name: 'aggregate_documents',
  displayName: 'Aggregate Documents',
  description: 'Perform aggregation operations on documents in a collection',
  props: {
    database: mongodbCommon.database,
    collection: mongodbCommon.collection(),
    pipeline: Property.Json({
      displayName: 'Aggregation Pipeline',
      description: 'Array of aggregation stages (e.g., [{"$match": {"status": "active"}}, {"$group": {"_id": "$category", "count": {"$sum": 1}}}])',
      required: true,
    }),
  },
  async run(context) {
    const client = await mongodbConnect(context.auth);

    try {
      if (!context.propsValue.collection) {
        throw new Error('Collection is required');
      }

      if (!context.propsValue.pipeline) {
        throw new Error('Aggregation pipeline is required');
      }

      // Use the database from auth
      // Use the database from props or auth
      const databaseName = context.propsValue.database || context.auth.database;
      if (!databaseName) {
        throw new Error('Database is required. Please specify it in the connection settings or in this action.');
      }
      const db = client.db(databaseName);
      const collection = db.collection(context.propsValue.collection);

      const pipeline = context.propsValue.pipeline;

      if (!Array.isArray(pipeline)) {
        throw new Error('Aggregation pipeline must be an array of stages');
      }

      const result = await collection.aggregate(pipeline).toArray();

      return {
        result,
        count: result.length
      };
    } finally {
      await client.close();
    }
  },
});
