import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const writeFields: OutputSchemaField[] = [
  { key: 'taskID', label: 'Task ID', format: 'number' },
  {
    key: 'status',
    label: 'Task Status',
    description: 'published when Algolia finished applying the write; notPublished if it was still pending after 30 seconds or its status could not be checked (it may still be applied).',
  },
  { key: 'note', label: 'Note' },
];

const writeRecordsSchema: OutputSchema = {
  fields: [
    ...writeFields,
    { key: 'objectIDs', label: 'Object IDs' },
  ],
};

const browseRecordsSchema: OutputSchema = {
  fields: [
    {
      key: 'records',
      label: 'Records',
      value: '',
      listItems: [{ key: 'objectID', label: 'Object ID' }, { key: 'record', value: '', label: 'All Fields', dynamicKey: true, description: 'Every attribute of the record.' }],
    },
  ],
  itemLabel: '{objectID}',
};

const listIndicesSchema: OutputSchema = {
  fields: [
    {
      key: 'indices',
      label: 'Indices',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'entries', label: 'Records', format: 'number' },
        { key: 'dataSize', label: 'Data Size', format: 'filesize' },
        { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
        { key: 'primary', label: 'Primary Index' },
        { key: 'replicas', label: 'Replicas' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const searchRecordsSchema: OutputSchema = {
  fields: [
    {
      key: 'hits',
      label: 'Hits',
      labelKey: 'objectID',
      listItems: [{ key: 'objectID', label: 'Object ID' }, { key: 'record', value: '', label: 'All Fields', dynamicKey: true, description: 'Every attribute of the record.' }],
    },
    { key: 'nbHits', label: 'Total Hits', format: 'number' },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'nbPages', label: 'Total Pages', format: 'number' },
    { key: 'hitsPerPage', label: 'Hits Per Page', format: 'number' },
    { key: 'query', label: 'Query' },
  ],
};

const getRecordSchema: OutputSchema = {
  fields: [
    {
      key: 'record',
      label: 'Record',
      dynamicKey: true,
      description: 'Every attribute of the record.',
    },
  ],
};

const updateRecordAttributesSchema: OutputSchema = {
  fields: [
    ...writeFields,
    { key: 'objectID', label: 'Object ID' },
    { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  ],
};

const deleteRecordsByFilterSchema: OutputSchema = {
  fields: writeFields,
};

const getIndexSettingsSchema: OutputSchema = {
  fields: [
    {
      key: 'settings',
      label: 'Settings',
      children: [
        { key: 'searchableAttributes', label: 'Searchable Attributes' },
        { key: 'attributesForFaceting', label: 'Attributes For Faceting' },
        { key: 'attributesToRetrieve', label: 'Attributes To Retrieve' },
        { key: 'customRanking', label: 'Custom Ranking' },
        { key: 'replicas', label: 'Replicas' },
        { key: 'hitsPerPage', label: 'Hits Per Page', format: 'number' },
      ],
    },
  ],
};

export const algoliaOutputSchemas = {
  writeRecords: writeRecordsSchema,
  browseRecords: browseRecordsSchema,
  listIndices: listIndicesSchema,
  searchRecords: searchRecordsSchema,
  getRecord: getRecordSchema,
  updateRecordAttributes: updateRecordAttributesSchema,
  deleteRecordsByFilter: deleteRecordsByFilterSchema,
  getIndexSettings: getIndexSettingsSchema,
};
