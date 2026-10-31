import { createAction } from '@activepieces/pieces-framework';
import { BSON } from 'mongodb';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';
import { updateDocumentsOutputSchema } from '../../output-schemas';

export const updateOneDocumentAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_update_one_document',
  displayName: 'Update One Document',
  description: 'Update the first document that matches a filter.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: updateDocumentsOutputSchema,
  aiMetadata: {
    description: 'Applies update operators such as $set or $inc to at most one document, the first that matches the filter; with upsert it inserts one when nothing matches. Pick it over Update Documents when exactly one record should change, e.g. by _id ({"_id": {"$oid": "<id>"}}). Not idempotent: $inc and upsert change state on each call.',
    idempotent: false,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
    filter: mongodbAiProps.filter({ required: true }),
    update: mongodbAiProps.update({ required: true }),
    upsert: mongodbAiProps.upsert({ required: false }),
  },
  async run(context) {
    const filter: Document = BSON.EJSON.deserialize(context.propsValue.filter);
    const update: Document = BSON.EJSON.deserialize(context.propsValue.update);
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const result = await client
        .db(databaseName)
        .collection(context.propsValue.collection)
        .updateOne(filter, update, { upsert: context.propsValue.upsert === 'true' });
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
