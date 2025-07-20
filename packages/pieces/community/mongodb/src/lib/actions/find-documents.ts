import { createAction, Property } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../..';
import { mongodbCommon, mongodbConnect } from '../common';

export default createAction({
  auth: mongodbAuth,
  name: 'find_documents',
  displayName: 'Find Documents',
  description: 'Find documents in a collection',
  props: {
    database: mongodbCommon.database,
    collection: mongodbCommon.collection(),
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
    const client = await mongodbConnect(context.auth);

    try {
      if (!context.propsValue.collection) {
        throw new Error('Collection is required');
      }

      const databaseName = context.propsValue.database || context.auth.database;
      if (!databaseName) {
        throw new Error('Database is required. Please specify it in the connection settings or in this action.');
      }
      const db = client.db(databaseName);
      const collection = db.collection(context.propsValue.collection);

      const query = context.propsValue.query || {};
      const projection = context.propsValue.projection || {};
      const sort = context.propsValue.sort || {};
      const limit = context.propsValue.limit || 0;
      const skip = context.propsValue.skip || 0;

      let cursor = collection.find(query, { projection });

      if (Object.keys(sort).length > 0) {
        // MongoDB sort needs to be handled with care due to typing constraints
        // We'll use a type assertion but in a safer way than 'any'
        // The MongoDB driver expects a document with field names and sort direction (1 or -1)
        cursor = cursor.sort(sort as Record<string, 1 | -1>);
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
