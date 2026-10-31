import { createAction, Property } from '@activepieces/pieces-framework';
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
  audience: 'both',
  outputSchema: findDocumentsOutputSchema,
  aiMetadata: { description: 'Reads documents from a MongoDB collection, optionally filtered by a query, with projection, sort, limit, and skip. An empty query returns all documents in the collection; pass a query object to filter to matching documents. Use to look up or list records when you need raw documents rather than aggregated results. Requires a collection (and a database, from the action or the connection). Read-only and idempotent.', idempotent: true },
  props: {
    database: mongodbProps.database({ required: false }),
    collection: mongodbProps.collection({ required: true }),
    query: Property.Json({
      displayName: 'Query',
      description: 'MongoDB query to filter documents (e.g., {"status": "active"})',
      required: false,
      defaultValue: {},
    }),
    projection: Property.Json({
      displayName: 'Projection',
      description: 'Fields to include or exclude (e.g., {"name": 1, "_id": 0})',
      required: false,
      defaultValue: {},
    }),
    sort: Property.Json({
      displayName: 'Sort',
      description: 'Sort criteria (e.g., {"createdAt": -1})',
      required: false,
      defaultValue: {},
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of documents to return',
      required: false,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of documents to skip',
      required: false,
      defaultValue: 0,
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

      const query = context.propsValue.query || {};
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
