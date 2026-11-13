import { createAction, Property } from '@activepieces/pieces-framework';
import { BSON } from 'mongodb';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';
import { findDocumentsOutputSchema } from '../../output-schemas';

export const findDocumentsAiAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_find_documents',
  displayName: 'Find Documents',
  description: 'Find documents in a collection.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: findDocumentsOutputSchema,
  aiMetadata: {
    description: 'Reads documents from a collection that match a filter, with projection, sort, skip and limit (default 100, max 1000). Use Find One Document for a single document by _id, Count Documents when only the number matters, and Aggregate Documents for grouping or joins. The collection comes from List Collections.',
    idempotent: true,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
    filter: mongodbAiProps.filter({ required: false }),
    projection: mongodbAiProps.projection({ required: false }),
    sort: Property.Json({
      displayName: 'Sort',
      description: 'Sort order, 1 ascending and -1 descending, e.g. {"createdAt": -1}.',
      required: false,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of matching documents to skip, for paging. Defaults to 0.',
      required: false,
    }),
    limit: mongodbAiProps.limit({ required: false }),
  },
  async run(context) {
    const { projection, skip } = context.propsValue;
    const filter: Document = BSON.EJSON.deserialize(context.propsValue.filter ?? {});
    const sort: Document = context.propsValue.sort ?? {};
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const documents = await client
        .db(databaseName)
        .collection(context.propsValue.collection)
        .find(filter, { projection, sort, skip })
        .limit(mongodbUtils.limit({ value: context.propsValue.limit }))
        .toArray();
      return { documents, count: documents.length };
    } finally {
      await client.close();
    }
  },
});
