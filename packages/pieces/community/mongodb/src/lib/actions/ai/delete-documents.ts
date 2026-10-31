import { createAction } from '@activepieces/pieces-framework';
import { BSON } from 'mongodb';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';
import { deleteDocumentsOutputSchema } from '../../output-schemas';

export const deleteDocumentsAiAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_delete_documents',
  displayName: 'Delete Documents',
  description: 'Permanently delete every document that matches a filter.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  outputSchema: deleteDocumentsOutputSchema,
  aiMetadata: {
    description: 'Permanently deletes every document matching a filter and returns how many were deleted; there is no undo. An empty filter is rejected; to delete every document on purpose pass {"_id": {"$exists": true}}. Use Count Documents first to check how many match.',
    idempotent: false,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
    filter: mongodbAiProps.filter({ required: true }),
  },
  async run(context) {
    const filter: Document = BSON.EJSON.deserialize(context.propsValue.filter);
    if (Object.keys(filter).length === 0) {
      throw new Error('"filter" is empty and would delete every document. Pass {"_id": {"$exists": true}} to delete them all on purpose.');
    }
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const result = await client
        .db(databaseName)
        .collection(context.propsValue.collection)
        .deleteMany(filter);
      return { deletedCount: result.deletedCount };
    } finally {
      await client.close();
    }
  },
});
