import { createAction, Property } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../..';
import { mongodbCommon, mongodbConnect } from '../common';

export default createAction({
  auth: mongodbAuth,
  name: 'find_and_replace_documents',
  displayName: 'Find and Replace Documents',
  description: 'Replace documents that match a filter with a new document',
  props: {
    database: mongodbCommon.database,
    collection: mongodbCommon.collection(),
    filter: Property.Json({
      displayName: 'Filter',
      description: 'MongoDB query to select documents to replace (e.g., {"_id": "123"})',
      required: true,
    }),
    replacement: Property.Json({
      displayName: 'Replacement Document',
      description: 'New document that will replace the matched documents',
      required: true,
    }),
    upsert: Property.Checkbox({
      displayName: 'Upsert',
      description: 'Insert the document if no documents match the filter',
      required: false,
      defaultValue: false,
    }),
    returnDocument: Property.StaticDropdown({
      displayName: 'Return Document',
      description: 'Which version of the document to return',
      required: false,
      defaultValue: 'after',
      options: {
        options: [
          { label: 'Before Update', value: 'before' },
          { label: 'After Update', value: 'after' },
        ],
      },
    }),
  },
  async run(context) {
    const client = await mongodbConnect(context.auth);

    try {
      if (!context.propsValue.collection) {
        throw new Error('Collection is required');
      }

      if (!context.propsValue.filter) {
        throw new Error('Filter is required');
      }

      if (!context.propsValue.replacement) {
        throw new Error('Replacement document is required');
      }

      const databaseName = context.propsValue.database || context.auth.database;
      if (!databaseName) {
        throw new Error('Database is required. Please specify it in the connection settings or in this action.');
      }
      const db = client.db(databaseName);
      const collection = db.collection(context.propsValue.collection);

      const filter = context.propsValue.filter;
      const replacement = context.propsValue.replacement;
      const upsert = context.propsValue.upsert || false;
      const returnDocumentPreference = context.propsValue.returnDocument || 'after';

      let beforeDocument = null;
      if (returnDocumentPreference === 'before') {
        beforeDocument = await collection.findOne(filter);
      }

      const replaceResult = await collection.replaceOne(
        filter,
        replacement,
        {
          upsert
        }
      );

      let afterDocument = null;
      if (returnDocumentPreference === 'after' || (!beforeDocument && replaceResult.matchedCount > 0)) {
        const query = replaceResult.upsertedId
          ? { _id: replaceResult.upsertedId }
          : filter;
        afterDocument = await collection.findOne(query);
      }

      const document = returnDocumentPreference === 'before' ? beforeDocument : afterDocument;

      return {
        matchedCount: replaceResult.matchedCount,
        modifiedCount: replaceResult.modifiedCount,
        upsertedId: replaceResult.upsertedId,
        document,
      };
    } finally {
      await client.close();
    }
  },
});
