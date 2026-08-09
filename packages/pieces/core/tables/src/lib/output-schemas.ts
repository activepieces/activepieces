import { OutputSchema } from '@activepieces/pieces-framework';

/**
 * Shared shape returned by tablesCommon.formatRecord: cells is keyed by field
 * ID (opaque, so dynamicKey), each entry carrying its own name/value/timestamps.
 */
const recordFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Record ID' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'updated', label: 'Updated', format: 'datetime' },
  {
    key: 'cells',
    label: 'Cells',
    description:
      'Cell values keyed by field ID. Each entry carries fieldName, value, created and updated.',
    dynamicKey: true,
    labelKey: 'fieldName',
  },
];

const recordListOutputSchema = (label: string): OutputSchema => ({
  itemLabel: 'Record {id}',
  fields: [{ key: 'records', label, value: '', listItems: recordFields }],
});

const successFields: OutputSchema['fields'] = [
  { key: 'success', label: 'Success', format: 'boolean' },
];

export const getRecordActionOutputSchema: OutputSchema = { fields: recordFields };
export const updateRecordActionOutputSchema: OutputSchema = { fields: recordFields };
export const createRecordsActionOutputSchema = recordListOutputSchema('Created Records');
export const findRecordsActionOutputSchema = recordListOutputSchema('Found Records');

export const deleteRecordActionOutputSchema: OutputSchema = { fields: successFields };
export const deleteTableActionOutputSchema: OutputSchema = { fields: successFields };
export const clearTableActionOutputSchema: OutputSchema = { fields: successFields };

export const createTableActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Internal ID',
      description: 'Internal identifier. Use Table ID for referencing this table in other Tables actions and triggers.',
    },
    { key: 'name', label: 'Table Name' },
    {
      key: 'externalId',
      label: 'Table ID',
      description: 'Use this value for the Table Name field in other Tables actions and triggers.',
    },
    { key: 'created', label: 'Created', format: 'datetime' },
    { key: 'updated', label: 'Updated', format: 'datetime' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Field Name' },
        { key: 'type', label: 'Type' },
        { key: 'externalId', label: 'Field ID' },
      ],
    },
  ],
};

export const downloadTableActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'name', label: 'File Name' },
    { key: 'rowCount', label: 'Row Count', format: 'number' },
  ],
};

export const newRecordTriggerOutputSchema: OutputSchema = { fields: recordFields };
export const updatedRecordTriggerOutputSchema: OutputSchema = { fields: recordFields };
export const deletedRecordTriggerOutputSchema: OutputSchema = { fields: recordFields };
