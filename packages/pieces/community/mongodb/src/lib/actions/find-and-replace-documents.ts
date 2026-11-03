import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { BSON } from 'mongodb';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../auth';
import { findAndReplaceDocumentsOutputSchema } from '../output-schemas';
import { mongodbApi } from '../common/api';
import { mongodbClient } from '../common/client';
import { mongodbProps } from '../common/props';

export const findAndReplaceDocumentsAction = createAction({
  auth: mongodbAuth,
  name: 'find_and_replace_documents',
  classification: 'WRITE',
  displayName: 'Find and Replace Document',
  description: 'Replace the first document that matches a filter',
  audience: 'human',
  outputSchema: findAndReplaceDocumentsOutputSchema,
  aiMetadata: { description: 'Replaces the first document matching a filter with an entirely new document via replaceOne (the whole document is overwritten, not patched), and can return either the before or after version. Choose this over Update Documents when swapping a full document rather than applying field-level operators. Filter and replacement are required; supports upsert. Mutating and not idempotent.', idempotent: false },
  propertyGroups: [
    { key: 'where', display: 'section', label: 'Where', icon: 'location', props: ['database', 'collection'] },
    { key: 'match', display: 'section', label: 'Which Document', icon: 'filter', props: ['filter'] },
    { key: 'replacement', display: 'section', label: 'Replacement', icon: 'file', props: ['replacement_info', 'replacement', 'upsert', 'returnDocument'] },
  ],
  props: {
    database: mongodbProps.database({ required: false }),
    collection: mongodbProps.collection({ required: true }),
    filter: Property.Json({
      displayName: 'Filter',
      description: 'Fields to match, e.g. {"_id": {"$oid": "…"}}.',
      required: true,
    }),
    replacement_info: Property.MarkDown({
      value: 'Replaces the first match with this whole document. ObjectIds: `{"$oid": "…"}`.',
      variant: MarkdownVariant.INFO,
    }),
    replacement: Property.Json({
      displayName: 'Replacement Document',
      description: 'The new document, without $ operators, e.g. {"name": "Ada"}.',
      required: true,
    }),
    upsert: Property.Checkbox({
      displayName: 'Insert If Nothing Matches',
      description: 'Upsert: create a new document when no document matches the filter.',
      required: false,
      defaultValue: false,
    }),
    returnDocument: Property.StaticDropdown({
      displayName: 'Return Document',
      description: 'The document as it was before the replace, or as it is after.',
      required: false,
      defaultValue: 'after',
      options: {
        options: [
          { label: 'Before Replace', value: 'before' },
          { label: 'After Replace', value: 'after' },
        ],
      },
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

      if (!context.propsValue.replacement) {
        throw new Error('Replacement document is required');
      }

      const databaseName = context.propsValue.database || context.auth.props.database;
      if (!databaseName) {
        throw new Error('Database is required. Please specify it in the connection settings or in this action.');
      }
      const db = client.db(databaseName);
      const collection = db.collection(context.propsValue.collection);

      const filter: Document = BSON.EJSON.deserialize(context.propsValue.filter);
      const replacement: Document = BSON.EJSON.deserialize(context.propsValue.replacement);
      const upsert = context.propsValue.upsert || false;
      const returnDocumentPreference = context.propsValue.returnDocument || 'after';

      return await mongodbApi.findAndReplaceDocument({
        collection,
        filter,
        replacement,
        upsert,
        returnDocumentPreference,
      });
    } finally {
      await client.close();
    }
  },
});
