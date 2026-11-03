import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { BSON } from 'mongodb';
import type { Document } from 'mongodb';
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
  description: 'Update matching documents and return them',
  audience: 'human',
  outputSchema: findAndUpdateDocumentsOutputSchema,
  aiMetadata: { description: 'Applies MongoDB update operators to all documents matching a filter via updateMany, then optionally re-reads and returns the matched documents in their post-update state. Choose this over plain Update Documents when the agent needs to see the resulting documents, not just counts. Filter and update are required; supports upsert. Not idempotent: it mutates state and operators like $inc compound on each call.', idempotent: false },
  propertyGroups: [
    { key: 'where', display: 'section', label: 'Where', icon: 'location', props: ['database', 'collection'] },
    { key: 'match', display: 'section', label: 'Which Documents', icon: 'filter', props: ['filter_warning', 'filter'] },
    { key: 'changes', display: 'section', label: 'Changes', icon: 'code', props: ['update_info', 'update', 'upsert', 'returnUpdated'] },
  ],
  props: {
    database: mongodbProps.database({ required: false }),
    collection: mongodbProps.collection({ required: true }),
    filter_warning: Property.MarkDown({
      value: 'An empty filter `{}` updates every document in the collection.',
      variant: MarkdownVariant.WARNING,
    }),
    filter: Property.Json({
      displayName: 'Filter',
      description: 'Fields to match, e.g. {"status": "pending"}.',
      required: true,
    }),
    update_info: Property.MarkDown({
      value: 'Write ObjectIds as `{"$oid": "…"}` and dates as `{"$date": "…"}`.',
      variant: MarkdownVariant.INFO,
    }),
    update: Property.Json({
      displayName: 'Update Operators',
      description: 'e.g. {"$set": {"status": "done"}}. Use $ operators only.',
      required: true,
    }),
    upsert: Property.Checkbox({
      displayName: 'Insert If Nothing Matches',
      description: 'Upsert: create a new document when no document matches the filter.',
      required: false,
      defaultValue: false,
    }),
    returnUpdated: Property.Checkbox({
      displayName: 'Return Updated Documents',
      description: 'Off: return only the counts.',
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

      const filter: Document = BSON.EJSON.deserialize(context.propsValue.filter);
      const update: Document = BSON.EJSON.deserialize(context.propsValue.update);
      const upsert = context.propsValue.upsert || false;
      const returnUpdated = context.propsValue.returnUpdated !== false;

      return await mongodbApi.findAndUpdateDocuments({
        client,
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
