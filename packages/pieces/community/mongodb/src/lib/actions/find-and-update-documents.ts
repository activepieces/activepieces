import { createAction, Property } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../auth';
import { findAndUpdateDocumentsOutputSchema } from '../output-schemas';
import { mongodbApi } from '../common/api';
import { mongodbClient } from '../common/client';
import { mongodbProps } from '../common/props';

export const findAndUpdateDocumentsAction = createAction({
  auth: mongodbAuth,
  name: 'find_and_update_documents',
  classification: 'WRITE',
  displayName: 'Find and Update Documents',
  description: 'Find documents and update them, returning the updated documents',
  audience: 'human',
  outputSchema: findAndUpdateDocumentsOutputSchema,
  aiMetadata: { description: 'Applies MongoDB update operators to all documents matching a filter via updateMany, then optionally re-reads and returns the matched documents in their post-update state. Choose this over plain Update Documents when the agent needs to see the resulting documents, not just counts. Filter and update are required; supports upsert. Not idempotent: it mutates state and operators like $inc compound on each call.', idempotent: false },
  props: {
    database: mongodbProps.database({ required: false }),
    collection: mongodbProps.collection({ required: true }),
    filter: Property.Json({
      displayName: 'Filter',
      description: 'MongoDB query to select documents to update (e.g., {"status": "pending"})',
      required: true,
    }),
    update: Property.Json({
      displayName: 'Update',
      description: 'MongoDB update operations (e.g., {"$set": {"status": "completed"}})',
      required: true,
    }),
    upsert: Property.Checkbox({
      displayName: 'Upsert',
      description: 'Insert a document if no documents match the filter',
      required: false,
      defaultValue: false,
    }),
    returnUpdated: Property.Checkbox({
      displayName: 'Return Updated Documents',
      description: 'Return the documents after updates are applied',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const client = await mongodbClient.create({ auth: context.auth });

    try {
      if (!context.propsValue.collection) {
        throw new Error('Collection is required');
      }

      if (!context.propsValue.filter) {
        throw new Error('Filter is required');
      }

      if (!context.propsValue.update) {
        throw new Error('Update is required');
      }

      const databaseName = context.propsValue.database || context.auth.props.database;
      if (!databaseName) {
        throw new Error('Database is required. Please specify it in the connection settings or in this action.');
      }
      const db = client.db(databaseName);
      const collection = db.collection(context.propsValue.collection);

      const filter = context.propsValue.filter;
      const update = context.propsValue.update;
      const upsert = context.propsValue.upsert || false;
      const returnUpdated = context.propsValue.returnUpdated !== false;

      return await mongodbApi.findAndUpdateDocuments({
        collection,
        filter,
        update,
        upsert,
        returnUpdated,
      });
    } finally {
      await client.close();
    }
  },
});
