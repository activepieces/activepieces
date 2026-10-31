import { createAction, Property } from '@activepieces/pieces-framework';
import { BSON, ObjectId } from 'mongodb';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';
import { mongodbFindOneDocumentOutputSchema } from '../../output-schemas';

export const findOneDocumentAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_find_one_document',
  outputSchema: mongodbFindOneDocumentOutputSchema,
  displayName: 'Find One Document',
  description: 'Get a single document by its _id or by a filter.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one document, looked up by its _id (as returned by Find Documents or Insert Documents) or by the first match of a filter; pass exactly one of the two. A 24-character hex _id matches both an ObjectId and the plain string. The document is null when nothing matches.',
    idempotent: true,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The document _id, e.g. "65f1c0a2b3d4e5f6a7b8c9d0". Leave empty when using Filter.',
      required: false,
    }),
    filter: mongodbAiProps.filter({
      required: false,
      description: 'MongoDB query object, e.g. {"email": "a@b.com"}; the first match is returned. Leave empty when using Document ID.',
    }),
    projection: mongodbAiProps.projection({ required: false }),
  },
  async run(context) {
    const { documentId, filter, projection } = context.propsValue;
    const hasFilter = filter !== undefined && Object.keys(filter).length > 0;
    if (Boolean(documentId) === hasFilter) {
      throw new Error('Provide exactly one of "documentId" or "filter".');
    }
    const query: Document = documentId ? idQuery({ documentId }) : BSON.EJSON.deserialize(filter ?? {});
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const document = await client
        .db(databaseName)
        .collection(context.propsValue.collection)
        .findOne(query, { projection });
      return { found: document !== null, document };
    } finally {
      await client.close();
    }
  },
});

function idQuery({ documentId }: { documentId: string }): Document {
  if (ObjectId.isValid(documentId) && documentId.length === 24) {
    return { _id: { $in: [new ObjectId(documentId), documentId] } };
  }
  return { _id: documentId };
}
