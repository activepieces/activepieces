import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { BSON } from 'mongodb';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../auth';
import { deleteDocumentsOutputSchema } from '../output-schemas';
import { mongodbClient } from '../common/client';
import { mongodbProps } from '../common/props';

export const deleteDocumentsAction = createAction({
  auth: mongodbAuth,
  name: 'delete_documents',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Documents',
  description: 'Delete every document that matches a filter',
  audience: 'human',
  outputSchema: deleteDocumentsOutputSchema,
  aiMetadata: { description: 'Removes every document matching a filter from a MongoDB collection via deleteMany. Use to delete records in bulk; an empty filter would match and delete all documents in the collection, so scope the filter carefully. The filter is required. Mutating and destructive; repeating the call deletes whatever now matches, so it is not idempotent.', idempotent: false },
  propertyGroups: [
    { key: 'where', display: 'section', label: 'Where', icon: 'location', props: ['database', 'collection'] },
    { key: 'match', display: 'section', label: 'Which Documents', icon: 'filter', props: ['filter_warning', 'filter'] },
  ],
  props: {
    database: mongodbProps.database({ required: false }),
    collection: mongodbProps.collection({ required: true }),
    filter_warning: Property.MarkDown({
      value: 'An empty filter `{}` deletes every document in the collection.',
      variant: MarkdownVariant.WARNING,
    }),
    filter: Property.Json({
      displayName: 'Filter',
      description: 'Fields to match, e.g. {"_id": {"$oid": "…"}}.',
      required: true,
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

      const filter: Document = BSON.EJSON.deserialize(context.propsValue.filter || {});

      const result = await collection.deleteMany(filter);

      return {
        deletedCount: result.deletedCount,
      };
    } finally {
      await client.close();
    }
  },
});
