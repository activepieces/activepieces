import { createAction, Property } from '@activepieces/pieces-framework';
import { BSON } from 'mongodb';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbApi } from '../../common/api';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';
import { findAndReplaceDocumentsOutputSchema } from '../../output-schemas';

export const findAndReplaceDocumentAiAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_find_and_replace_document',
  displayName: 'Find and Replace Document',
  description: 'Replace the first document that matches a filter with a new document.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: findAndReplaceDocumentsOutputSchema,
  aiMetadata: {
    description: 'Overwrites the first document matching a filter with a whole new document (fields not in the replacement are removed; _id is kept) and returns it as it was before or after. Use Update Documents to change only some fields. Supports upsert. Not idempotent.',
    idempotent: false,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
    filter: mongodbAiProps.filter({ required: true }),
    replacement: Property.Json({
      displayName: 'Replacement Document',
      description: 'The full new document, without update operators, e.g. {"name": "Ada", "status": "active"}.',
      required: true,
    }),
    upsert: mongodbAiProps.upsert({ required: false }),
    returnDocument: Property.StaticDropdown({
      displayName: 'Return Document',
      description: 'Return the document as it was before or after the replacement. Defaults to after.',
      required: false,
      options: {
        options: [
          { label: 'Before', value: 'before' },
          { label: 'After', value: 'after' },
        ],
      },
    }),
  },
  async run(context) {
    const returnDocument = context.propsValue.returnDocument ?? 'after';
    if (returnDocument !== 'before' && returnDocument !== 'after') {
      throw new Error('"returnDocument" must be "before" or "after".');
    }
    const filter: Document = BSON.EJSON.deserialize(context.propsValue.filter);
    const replacement: Document = BSON.EJSON.deserialize(context.propsValue.replacement);
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      return await mongodbApi.findAndReplaceDocument({
        collection: client.db(databaseName).collection(context.propsValue.collection),
        filter,
        replacement,
        upsert: context.propsValue.upsert === 'true',
        returnDocumentPreference: returnDocument,
      });
    } finally {
      await client.close();
    }
  },
});
