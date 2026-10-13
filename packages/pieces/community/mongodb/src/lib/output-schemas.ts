import { OutputSchema } from '@activepieces/pieces-framework';

const updateResultFields: OutputSchema['fields'] = [
  { key: 'matchedCount', label: 'Matched Count', format: 'number' },
  { key: 'modifiedCount', label: 'Modified Count', format: 'number' },
  {
    key: 'upsertedId',
    label: 'Upserted ID',
    description: 'Id of the document created by an upsert; null when no upsert happened.',
  },
];

export const insertDocumentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'insertedId',
      label: 'Inserted ID',
      description: 'Id of the inserted document (single-document insert).',
    },
    {
      key: 'acknowledged',
      label: 'Acknowledged',
      format: 'boolean',
      description: 'Whether the write was acknowledged (single-document insert).',
    },
    {
      key: 'insertedCount',
      label: 'Inserted Count',
      format: 'number',
      description: 'Number of inserted documents (multi-document insert).',
    },
    {
      key: 'insertedIds',
      label: 'Inserted IDs',
      dynamicKey: true,
      description: 'Map of array index to inserted document id (multi-document insert).',
    },
  ],
};

export const findDocumentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'documents',
      label: 'Documents',
      description: 'Matching documents; each document\'s fields depend on the collection.',
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const updateDocumentsOutputSchema: OutputSchema = {
  fields: [
    ...updateResultFields,
    { key: 'upsertedCount', label: 'Upserted Count', format: 'number' },
  ],
};

export const deleteDocumentsOutputSchema: OutputSchema = {
  fields: [{ key: 'deletedCount', label: 'Deleted Count', format: 'number' }],
};

export const aggregateDocumentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'result',
      label: 'Results',
      description: 'Documents produced by the aggregation pipeline.',
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const findAndUpdateDocumentsOutputSchema: OutputSchema = {
  fields: [
    ...updateResultFields,
    { key: 'upsertedCount', label: 'Upserted Count', format: 'number' },
    {
      key: 'documents',
      label: 'Updated Documents',
      description: 'The updated documents; only present when "Return Updated Documents" is enabled.',
    },
  ],
};

export const findAndReplaceDocumentsOutputSchema: OutputSchema = {
  fields: [
    ...updateResultFields,
    {
      key: 'document',
      label: 'Document',
      description: 'The replaced document, before or after replacement per the "Return Document" option.',
    },
  ],
};
