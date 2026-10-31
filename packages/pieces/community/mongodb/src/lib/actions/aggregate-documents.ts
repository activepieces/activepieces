import { createAction, Property } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../auth';
import { aggregateDocumentsOutputSchema } from '../output-schemas';
import { mongodbClient } from '../common/client';
import { mongodbProps } from '../common/props';

export const aggregateDocumentsAction = createAction({
  auth: mongodbAuth,
  name: 'aggregate_documents',
  classification: 'WRITE',
  displayName: 'Aggregate Documents',
  description: 'Perform aggregation operations on documents in a collection',
  audience: 'both',
  outputSchema: aggregateDocumentsOutputSchema,
  aiMetadata: { description: 'Runs a MongoDB aggregation pipeline over a collection and returns the resulting documents. Use for grouping, joining, computed fields, faceting, or any read that goes beyond a simple find filter. The pipeline must be an array of stage objects (e.g. $match, $group, $sort). Read-only and idempotent for read-only pipelines (avoid write stages like $out/$merge).', idempotent: true },
  props: {
    database: mongodbProps.database({ required: false }),
    collection: mongodbProps.collection({ required: true }),
    pipeline: Property.Json({
      displayName: 'Aggregation Pipeline',
      description: 'Array of aggregation stages (e.g., [{"$match": {"status": "active"}}, {"$group": {"_id": "$category", "count": {"$sum": 1}}}])',
      required: true,
    }),
  },
  async run(context) {
    const client = await mongodbClient.create({ auth: context.auth });

    try {
      if (!context.propsValue.collection) {
        throw new Error('Collection is required');
      }

      if (!context.propsValue.pipeline) {
        throw new Error('Aggregation pipeline is required');
      }

      const databaseName = context.propsValue.database || context.auth.props.database;
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
