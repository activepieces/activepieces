import { OutputSchema } from '@activepieces/pieces-framework';

export const humanRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Record ID' },
  ],
};

export const findRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'record', label: 'Record', children: [{ key: 'id', label: 'Record ID' }] },
    { key: 'message', label: 'Message' },
  ],
};

export const deleteRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'delete', label: 'Delete', format: 'boolean' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'id', label: 'Record ID' },
  ],
};

export const listObjectsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'objects',
      label: 'Objects',
      labelKey: 'name',
      listItems: [
        { key: 'key', label: 'Object Key' },
        { key: 'name', label: 'Object Name' },
      ],
    },
  ],
};

export const getObjectFieldsOutputSchema: OutputSchema = {
  fields: [
    { key: 'object_key', label: 'Object Key' },
    { key: 'name', label: 'Object Name' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'name',
      listItems: [
        { key: 'key', label: 'Field Key' },
        { key: 'name', label: 'Field Name' },
        { key: 'type', label: 'Field Type' },
        { key: 'required', label: 'Required', format: 'boolean' },
        { key: 'unique', label: 'Unique', format: 'boolean' },
        { key: 'options', label: 'Options' },
      ],
    },
  ],
};

export const searchRecordsOutputSchema: OutputSchema = {
  fields: [
    { key: 'records', label: 'Records', listItems: splitRecordFields() },
    { key: 'total_records', label: 'Total Records', format: 'number' },
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
    { key: 'current_page', label: 'Current Page', format: 'number' },
  ],
};

export const splitRecordOutputSchema: OutputSchema = {
  fields: splitRecordFields(),
};

function splitRecordFields(): OutputSchema['fields'] {
  return [
    { key: 'id', label: 'Record ID' },
    {
      key: 'fields',
      label: 'Fields',
      dynamicKey: true,
      description: 'Values keyed by Knack field key (field_N formatted, field_N_raw structured).',
    },
  ];
}
