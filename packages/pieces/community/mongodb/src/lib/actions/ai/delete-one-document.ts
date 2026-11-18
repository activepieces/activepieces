import { createAction } from '@activepieces/pieces-framework';
import { BSON } from 'mongodb';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';
import { deleteDocumentsOutputSchema } from '../../output-schemas';

export const deleteOneDocumentAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_delete_one_document',
  displayName: 'Delete One Document',
  description: 'Permanently delete the first document that matches a filter.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  outputSchema: deleteDocumentsOutputSchema,
  aiMetadata: {
    description: 'Permanently deletes at most one document, the first that matches the filter; there is no undo. Pick it over Delete Documents when exactly one record should go, e.g. by _id ({"_id": {"$oid": "<id>"}}). An empty filter is rejected.',
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
      throw new Error('"filter" is empty and would delete an arbitrary document. Pass a filter that identifies the document.');
    }
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const result = await client
        .db(databaseName)
        .collection(context.propsValue.collection)
        .deleteOne(filter);
      return { deletedCount: result.deletedCount };
    } finally {
      await client.close();
    }
  },
});
