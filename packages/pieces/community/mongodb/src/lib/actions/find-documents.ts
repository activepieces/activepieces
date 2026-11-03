import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { BSON } from 'mongodb';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../auth';
import { findDocumentsOutputSchema } from '../output-schemas';
import { mongodbClient } from '../common/client';
import { mongodbProps } from '../common/props';

export const findDocumentsAction = createAction({
  auth: mongodbAuth,
  name: 'find_documents',
  classification: 'SEARCH',
  displayName: 'Find Documents',
  description: 'Find documents in a collection',
  audience: 'human',
  outputSchema: findDocumentsOutputSchema,
  aiMetadata: { description: 'Reads documents from a MongoDB collection, optionally filtered by a query, with projection, sort, limit, and skip. An empty query returns all documents in the collection; pass a query object to filter to matching documents. Use to look up or list records when you need raw documents rather than aggregated results. Requires a collection (and a database, from the action or the connection). Read-only and idempotent.', idempotent: true },
  propertyGroups: [
    { key: 'where', display: 'section', label: 'Where', icon: 'location', props: ['database', 'collection'] },
    { key: 'match', display: 'section', label: 'Which Documents', icon: 'filter', props: ['filter_info', 'query'] },
    { key: 'results', display: 'section', label: 'Results', icon: 'sliders', props: ['projection', 'sort', 'limit', 'skip'] },
  ],
  props: {
    database: mongodbProps.database({ required: false }),
    collection: mongodbProps.collection({ required: true }),
    filter_info: Property.MarkDown({
      value: 'Write ObjectIds as `{"$oid": "…"}` and dates as `{"$date": "…"}`.',
      variant: MarkdownVariant.INFO,
    }),
    query: Property.Json({
      displayName: 'Filter',
      description: 'Fields to match, e.g. {"status": "active"}. Empty returns all.',
      required: false,
      defaultValue: {},
    }),
    projection: Property.Json({
      displayName: 'Projection',
      description: 'Fields to return, e.g. {"name": 1, "_id": 0}.',
      required: false,
      defaultValue: {},
    }),
    sort: Property.Json({
      displayName: 'Sort',
      description: 'Sort order, e.g. {"createdAt": -1} for newest first.',
      required: false,
      defaultValue: {},
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Most documents to return. Empty or 0 returns every match.',
      required: false,
      width: 'half',
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Matching documents to skip before returning results.',
      required: false,
      defaultValue: 0,
      width: 'half',
    }),
  },
  async run(context) {
    const client = await mongodbClient.create({ auth: context.auth });

    try {
      if (!context.propsValue.collection) {
        throw new Error('Collection is required');
      }

      const databaseName = context.propsValue.database || context.auth.props.database;
      if (!databaseName) {
        throw new Error('Database is required. Please specify it in the connection settings or in this action.');
      }
      const db = client.db(databaseName);
      const collection = db.collection(context.propsValue.collection);

      const query: Document = BSON.EJSON.deserialize(context.propsValue.query || {});
      const projection = context.propsValue.projection || {};
      const sort: Document = context.propsValue.sort || {};
      const limit = context.propsValue.limit || 0;
      const skip = context.propsValue.skip || 0;

      let cursor = collection.find(query, { projection });

      if (Object.keys(sort).length > 0) {
        cursor = cursor.sort(sort);
      }

      if (skip > 0) {
        cursor = cursor.skip(skip);
      }

      if (limit > 0) {
        cursor = cursor.limit(limit);
      }

      const documents = await cursor.toArray();

      return {
        documents,
        count: documents.length
      };
    } finally {
      await client.close();
    }
  },
});
