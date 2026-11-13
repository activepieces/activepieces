import { createAction, Property } from '@activepieces/pieces-framework';
import { BSON } from 'mongodb';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';
import { aggregateDocumentsOutputSchema } from '../../output-schemas';

export const aggregateDocumentsAiAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_aggregate_documents',
  displayName: 'Aggregate Documents',
  description: 'Run an aggregation pipeline on a collection.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: aggregateDocumentsOutputSchema,
  aiMetadata: {
    description: 'Runs an aggregation pipeline (an array of stages such as $match, $group, $sort, $lookup) over a collection and returns the resulting documents. Use it for grouping, joins, computed fields or totals; use Find Documents for a plain filtered read. Stages $out and $merge write to another collection, so leave them out unless asked.',
    idempotent: false,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
    pipeline: Property.Json({
      displayName: 'Pipeline',
      description: 'Array of stages, e.g. [{"$match": {"status": "active"}}, {"$group": {"_id": "$category", "total": {"$sum": 1}}}]. Use {"$oid": "<24-hex id>"} for an ObjectId and {"$date": "<ISO date>"} for a date.',
      required: true,
    }),
  },
  async run(context) {
    const pipeline: Document | Document[] = BSON.EJSON.deserialize(context.propsValue.pipeline);
    if (!Array.isArray(pipeline)) {
      throw new Error('"pipeline" must be an array of stage objects.');
    }
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const result = await client
        .db(databaseName)
        .collection(context.propsValue.collection)
        .aggregate(pipeline)
        .toArray();
      return { result, count: result.length };
    } finally {
      await client.close();
    }
  },
});
