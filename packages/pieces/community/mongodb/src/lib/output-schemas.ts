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

const dropResultFields: OutputSchema['fields'] = [
  { key: 'nIndexesWas', label: 'Indexes Before Drop', format: 'number' },
  { key: 'ok', label: 'OK', format: 'number', description: '1 when the command succeeded.' },
];

export const mongodbBulkWriteOutputSchema: OutputSchema = {
  fields: [
    { key: 'insertedCount', label: 'Inserted Count', format: 'number' },
    { key: 'matchedCount', label: 'Matched Count', format: 'number' },
    { key: 'modifiedCount', label: 'Modified Count', format: 'number' },
    { key: 'deletedCount', label: 'Deleted Count', format: 'number' },
    { key: 'upsertedCount', label: 'Upserted Count', format: 'number' },
    {
      key: 'insertedIds',
      label: 'Inserted IDs',
      dynamicKey: true,
      description: 'Map of operation index to the _id of the inserted document.',
    },
    {
      key: 'upsertedIds',
      label: 'Upserted IDs',
      dynamicKey: true,
      description: 'Map of operation index to the _id of the upserted document.',
    },
  ],
};

export const mongodbCountDocumentsOutputSchema: OutputSchema = {
  fields: [{ key: 'count', label: 'Count', format: 'number' }],
};

export const mongodbCreateCollectionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', format: 'number', description: '1 when the command succeeded.' },
    { key: 'database', label: 'Database' },
    { key: 'collection', label: 'Collection' },
  ],
};

export const mongodbCreateIndexOutputSchema: OutputSchema = {
  fields: [{ key: 'indexName', label: 'Index Name' }],
};

export const mongodbDistinctValuesOutputSchema: OutputSchema = {
  fields: [
    { key: 'values', label: 'Values', description: 'Unique values of the field, sorted ascending.' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const mongodbDropCollectionOutputSchema: OutputSchema = {
  fields: [
    ...dropResultFields,
    { key: 'ns', label: 'Namespace', description: 'The dropped collection as <database>.<collection>.' },
    { key: 'database', label: 'Database' },
    { key: 'collection', label: 'Collection' },
  ],
};

export const mongodbDropIndexOutputSchema: OutputSchema = {
  fields: dropResultFields,
};

export const mongodbFindOneDocumentOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    {
      key: 'document',
      label: 'Document',
      description: 'The matching document; its fields depend on the collection. Null when nothing matches.',
    },
  ],
};

export const mongodbListCollectionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'collections',
      label: 'Collections',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type', description: 'collection, view or timeseries.' },
        { key: 'options', label: 'Options' },
        {
          key: 'info',
          label: 'Info',
          children: [
            { key: 'readOnly', label: 'Read Only', format: 'boolean' },
            { key: 'uuid', label: 'UUID' },
          ],
        },
        {
          key: 'idIndex',
          label: 'ID Index',
          children: [
            { key: 'v', label: 'Index Version', format: 'number' },
            { key: 'key', label: 'Keys', dynamicKey: true },
            { key: 'name', label: 'Name' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const mongodbListDatabasesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'databases',
      label: 'Databases',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'sizeOnDisk', label: 'Size on Disk', format: 'filesize' },
        { key: 'empty', label: 'Empty', format: 'boolean' },
      ],
    },
    { key: 'totalSize', label: 'Total Size', format: 'filesize' },
    { key: 'totalSizeMb', label: 'Total Size (MB)', format: 'number' },
    { key: 'ok', label: 'OK', format: 'number', description: '1 when the command succeeded.' },
  ],
};

export const mongodbListIndexesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'indexes',
      label: 'Indexes',
      labelKey: 'name',
      listItems: [
        { key: 'v', label: 'Index Version', format: 'number' },
        {
          key: 'key',
          label: 'Keys',
          dynamicKey: true,
          description: 'Map of field name to direction (1, -1) or index type such as "text".',
        },
        { key: 'name', label: 'Name' },
        { key: 'unique', label: 'Unique', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};
