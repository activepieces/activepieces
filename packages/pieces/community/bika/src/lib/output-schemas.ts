import { OutputSchema } from '@activepieces/pieces-framework';

const envelopeFields: OutputSchema['fields'] = [
  { key: 'success', label: 'Success', format: 'boolean' },
  { key: 'code', label: 'Status Code', format: 'number' },
  { key: 'message', label: 'Message' },
];

const bikaRecordFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Record ID', description: 'The record ID (starts with "rec"). Use it to read, update or delete this record later.' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  {
    key: 'fields',
    label: 'Fields',
    dynamicKey: true,
    description: 'The cell values keyed by field name. The names depend on the database.',
  },
];

const agentRecordFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Record ID' },
  { key: 'database_id', label: 'Database ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  {
    key: 'fields',
    label: 'Fields',
    dynamicKey: true,
    description: 'Cell values keyed by field name. Text longer than 4,000 characters is cut; attachments are {id, name, mime_type, size, url}.',
  },
];

const truncatedFieldsField: OutputSchema['fields'][number] = {
  key: 'truncated_fields',
  label: 'Truncated Fields',
  description: 'Names of fields whose text (over 4,000 characters) or list (over 100 items) was cut.',
};

export const bikaOutputSchemas = {
  humanCreatedRecord: {
    fields: [
      ...envelopeFields,
      {
        key: 'data',
        label: 'Data',
        children: [{ key: 'records', label: 'Created Records', labelKey: 'id', listItems: bikaRecordFields }],
      },
    ],
  },
  humanRecord: {
    fields: [...envelopeFields, { key: 'data', label: 'Record', children: bikaRecordFields }],
  },
  humanDeleted: {
    fields: [
      ...envelopeFields,
      {
        key: 'data',
        label: 'Data',
        children: [
          { key: 'id', label: 'Record ID' },
          { key: 'deleted', label: 'Deleted', format: 'boolean' },
        ],
      },
    ],
  },
  humanFind: {
    fields: [
      ...envelopeFields,
      {
        key: 'data',
        label: 'Data',
        children: [
          { key: 'records', label: 'Records', labelKey: 'id', listItems: bikaRecordFields },
          { key: 'hasMore', label: 'Has More', format: 'boolean' },
          { key: 'offset', label: 'Next Offset', description: 'Pass it as Offset to fetch the next records.' },
        ],
      },
    ],
  },
  spaces: {
    fields: [
      {
        key: 'spaces',
        label: 'Spaces',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Space ID' },
          { key: 'name', label: 'Name' },
          { key: 'plan', label: 'Plan' },
          { key: 'member_count', label: 'Members', format: 'number' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  databases: {
    fields: [
      { key: 'space_id', label: 'Space ID' },
      {
        key: 'databases',
        label: 'Databases',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Database ID' },
          { key: 'name', label: 'Name' },
          { key: 'path', label: 'Folder Path' },
          { key: 'parent_id', label: 'Parent Folder ID' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'truncated', label: 'Truncated', format: 'boolean', description: 'True when the space has more than 200 databases and only the first 200 are listed.' },
    ],
  },
  fields: {
    fields: [
      { key: 'database_id', label: 'Database ID' },
      {
        key: 'fields',
        label: 'Fields',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Field ID' },
          { key: 'name', label: 'Name' },
          { key: 'type', label: 'Type' },
          { key: 'primary', label: 'Primary', format: 'boolean' },
          { key: 'writable', label: 'Writable', format: 'boolean' },
          { key: 'value_format', label: 'Value Format', description: 'How to write a value for this field.' },
          { key: 'options', label: 'Options', description: 'Option names for select fields.' },
          { key: 'description', label: 'Description' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  agentFind: {
    fields: [
      { key: 'records', label: 'Records', labelKey: 'id', listItems: agentRecordFields },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
      { key: 'next_offset', label: 'Next Offset', description: 'Pass it as Offset to get the next page; null when there are no more records.' },
      truncatedFieldsField,
    ],
  },
  agentRecord: {
    fields: [...agentRecordFields, truncatedFieldsField],
  },
  agentDeleted: {
    fields: [
      { key: 'id', label: 'Record ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
    ],
  },
} satisfies Record<string, OutputSchema>;
