import { createAction, Property } from '@activepieces/pieces-framework';
import { BSON } from 'mongodb';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbApi } from '../../common/api';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';
import { findAndUpdateDocumentsOutputSchema } from '../../output-schemas';

export const findAndUpdateDocumentsAiAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_find_and_update_documents',
  displayName: 'Find and Update Documents',
  description: 'Update every document that matches a filter and return the updated documents.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: findAndUpdateDocumentsOutputSchema,
  aiMetadata: {
    description: 'Applies update operators to every document matching a filter, then re-reads the documents that match the same filter and returns them with the counts. Pick it over Update Documents when the updated documents are needed; if the update changes a field the filter uses, the re-read can miss them. Not idempotent.',
    idempotent: false,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
    filter: mongodbAiProps.filter({ required: true }),
    update: mongodbAiProps.update({ required: true }),
    upsert: mongodbAiProps.upsert({ required: false }),
    returnUpdated: Property.StaticDropdown({
      displayName: 'Return Updated Documents',
      description: 'Return the documents after the update. Defaults to true.',
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
    const filter: Document = BSON.EJSON.deserialize(context.propsValue.filter);
    const update: Document = BSON.EJSON.deserialize(context.propsValue.update);
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      return await mongodbApi.findAndUpdateDocuments({
        collection: client.db(databaseName).collection(context.propsValue.collection),
        filter,
        update,
        upsert: context.propsValue.upsert === 'true',
        returnUpdated: context.propsValue.returnUpdated !== 'false',
      });
    } finally {
      await client.close();
    }
  },
});
