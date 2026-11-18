import { createAction, Property, tryCatch } from '@activepieces/pieces-framework';
import { BSON, MongoBulkWriteError } from 'mongodb';
import type { AnyBulkWriteOperation, Document } from 'mongodb';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';
import { mongodbBulkWriteOutputSchema } from '../../output-schemas';

export const bulkWriteAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_bulk_write',
  outputSchema: mongodbBulkWriteOutputSchema,
  displayName: 'Bulk Write',
  description: 'Run up to 500 single-document inserts, updates, replaces and deletes in one call.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Runs a list of single-document operations (insertOne, updateOne, replaceOne, deleteOne) on one collection in one call, e.g. to upsert many records that each need different values. At most 500 operations; updateMany and deleteMany are not allowed. Ordered by default: it stops at the first failure and the error says how many operations ran. Not idempotent.',
    idempotent: false,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
    operations: Property.Json({
      displayName: 'Operations',
      description: 'Array of operations, each an object with exactly one key: {"insertOne": {"document": {...}}}, {"updateOne": {"filter": {...}, "update": {"$set": {...}}, "upsert": true}}, {"replaceOne": {"filter": {...}, "replacement": {...}}} or {"deleteOne": {"filter": {...}}}. Use {"$oid": "<24-hex id>"} for an ObjectId and {"$date": "<ISO date>"} for a date.',
      required: true,
    }),
    ordered: Property.StaticDropdown({
      displayName: 'Ordered',
      description: 'true: run in order and stop at the first failure. false: run every operation and report all failures. Defaults to true.',
      required: false,
      options: {
        options: [
          { label: 'True', value: 'true' },
          { label: 'False', value: 'false' },
        ],
      },
    }),
  },
  async run(context) {
    const parsed: Document | Document[] = BSON.EJSON.deserialize(context.propsValue.operations);
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_OPERATIONS) {
      throw new Error(`"operations" must be an array of 1 to ${MAX_OPERATIONS} operations.`);
    }
    const operations = parsed.map((operation, index) => toOperation({ operation, index }));
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const { data: result, error } = await tryCatch(() =>
        client
          .db(databaseName)
          .collection(context.propsValue.collection)
          .bulkWrite(operations, { ordered: context.propsValue.ordered !== 'false' }),
      );
      if (error instanceof MongoBulkWriteError) {
        const failures = [error.writeErrors].flat().map((writeError) => `operation ${writeError.index}: ${writeError.errmsg}`);
        throw new Error(
          `Bulk write failed at ${failures.join('; ')}. Applied before the failure: ${error.insertedCount} inserted, ${error.modifiedCount} modified, ${error.upsertedCount} upserted, ${error.deletedCount} deleted.`,
        );
      }
      if (error) {
        throw error;
      }
      return {
        insertedCount: result.insertedCount,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        deletedCount: result.deletedCount,
        upsertedCount: result.upsertedCount,
        insertedIds: result.insertedIds,
        upsertedIds: result.upsertedIds,
      };
    } finally {
      await client.close();
    }
  },
});

function toOperation({ operation, index }: { operation: Document; index: number }): AnyBulkWriteOperation<Document> {
  const keys = Object.keys(operation);
  if (keys.length !== 1) {
    throw new Error(`Operation ${index} must have exactly one key: insertOne, updateOne, replaceOne or deleteOne.`);
  }
  const model = operation[keys[0]];
  switch (keys[0]) {
    case 'insertOne':
      return { insertOne: model };
    case 'updateOne':
      return { updateOne: model };
    case 'replaceOne':
      return { replaceOne: model };
    case 'deleteOne':
      if (!model?.filter || Object.keys(model.filter).length === 0) {
        throw new Error(`Operation ${index} (deleteOne) needs a non-empty filter.`);
      }
      return { deleteOne: model };
    default:
      throw new Error(`Operation ${index} uses "${keys[0]}"; only insertOne, updateOne, replaceOne and deleteOne are allowed.`);
  }
}

const MAX_OPERATIONS = 500;
