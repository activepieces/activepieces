import { OutputSchema } from '@activepieces/pieces-framework';

const airtableRecordFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Record ID' },
  { key: 'createdTime', label: 'Created Time', format: 'datetime' },
  { key: 'fields', label: 'Fields', dynamicKey: true },
];

const airtableRawFieldDefinitionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Field ID' },
  { key: 'name', label: 'Field Name' },
  { key: 'type', label: 'Field Type' },
  { key: 'description', label: 'Description' },
  { key: 'options', label: 'Options' },
];

const airtableRawTableFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Table ID' },
  { key: 'name', label: 'Table Name' },
  { key: 'description', label: 'Description' },
  { key: 'primaryFieldId', label: 'Primary Field ID' },
  { key: 'fields', label: 'Fields', listItems: airtableRawFieldDefinitionFields },
  {
    key: 'views',
    label: 'Views',
    listItems: [
      { key: 'id', label: 'View ID' },
      { key: 'name', label: 'View Name' },
      { key: 'type', label: 'View Type' },
    ],
  },
];

const airtableStrippedFieldDefinitionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Field ID' },
  { key: 'name', label: 'Field Name' },
  { key: 'type', label: 'Field Type' },
  { key: 'description', label: 'Description' },
];

const airtableStrippedTableFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Table ID' },
  { key: 'name', label: 'Table Name' },
  { key: 'description', label: 'Description' },
  { key: 'primaryFieldId', label: 'Primary Field ID' },
  { key: 'fields', label: 'Fields', listItems: airtableStrippedFieldDefinitionFields },
];

const airtableDeletedRecordFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Deleted Record ID' },
  { key: 'deleted', label: 'Deleted', format: 'boolean' },
];

const airtableBaseFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Base ID' },
  { key: 'name', label: 'Base Name' },
  { key: 'permissionLevel', label: 'Permission Level' },
];

const airtableCommentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Comment ID' },
  { key: 'createdTime', label: 'Created Time', format: 'datetime' },
  { key: 'lastUpdatedTime', label: 'Last Updated Time', format: 'datetime' },
  { key: 'text', label: 'Comment Text' },
  { key: 'parentCommentId', label: 'Parent Comment ID' },
  {
    key: 'author',
    label: 'Author',
    children: [
      { key: 'id', label: 'User ID' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'name', label: 'Name' },
    ],
  },
  {
    key: 'mentioned',
    label: 'Mentioned Users',
    dynamicKey: true,
    children: [
      { key: 'id', label: 'ID' },
      { key: 'type', label: 'Type' },
      { key: 'displayName', label: 'Display Name' },
      { key: 'email', label: 'Email', format: 'email' },
    ],
  },
  {
    key: 'reactions',
    label: 'Reactions',
    listItems: [
      {
        key: 'emoji',
        label: 'Emoji',
        children: [{ key: 'unicodeCharacter', label: 'Character' }],
      },
      {
        key: 'reactingUser',
        label: 'Reacting User',
        children: [
          { key: 'userId', label: 'User ID' },
          { key: 'email', label: 'Email', format: 'email' },
          { key: 'name', label: 'Name' },
        ],
      },
    ],
  },
];

export const createRecordAiActionOutputSchema: OutputSchema = {
  fields: airtableRecordFields,
};

export const getRecordAiActionOutputSchema: OutputSchema = {
  fields: airtableRecordFields,
};

export const updateRecordAiActionOutputSchema: OutputSchema = {
  fields: airtableRecordFields,
};

export const deleteRecordAiActionOutputSchema: OutputSchema = {
  fields: airtableDeletedRecordFields,
};

export const uploadAttachmentAiActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Record ID' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'fields', label: 'Fields', dynamicKey: true },
  ],
};

export const createTableAiActionOutputSchema: OutputSchema = {
  fields: airtableRawTableFields,
};

export const createBaseAiActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Base ID' },
    { key: 'tables', label: 'Tables', listItems: airtableRawTableFields },
  ],
};

export const getBaseSchemaAiActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Table Count', format: 'number' },
    { key: 'tables', label: 'Tables', listItems: airtableStrippedTableFields },
  ],
};

export const addCommentToRecordAiActionOutputSchema: OutputSchema = {
  fields: airtableCommentFields,
};

export const createFieldActionOutputSchema: OutputSchema = {
  fields: airtableRawFieldDefinitionFields,
};

export const updateFieldActionOutputSchema: OutputSchema = {
  fields: airtableRawFieldDefinitionFields,
};

export const updateTableActionOutputSchema: OutputSchema = {
  fields: airtableRawTableFields,
};

export const listBasesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Base Count', format: 'number' },
    {
      key: 'bases',
      label: 'Bases',
      labelKey: 'name',
      listItems: airtableBaseFields,
    },
  ],
};

export const listRecordsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Record Count', format: 'number' },
    { key: 'offset', label: 'Next Page Offset' },
    {
      key: 'records',
      label: 'Records',
      labelKey: 'id',
      listItems: airtableRecordFields,
    },
  ],
};

export const searchRecordsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Record Count', format: 'number' },
    {
      key: 'records',
      label: 'Records',
      labelKey: 'id',
      listItems: airtableRecordFields,
    },
  ],
};

export const upsertRecordsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Record Count', format: 'number' },
    {
      key: 'records',
      label: 'Records',
      labelKey: 'id',
      listItems: airtableRecordFields,
    },
    { key: 'createdRecords', label: 'Created Record IDs' },
    { key: 'updatedRecords', label: 'Updated Record IDs' },
  ],
};

export const deleteRecordsBatchActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Deleted Count', format: 'number' },
    {
      key: 'records',
      label: 'Deleted Records',
      labelKey: 'id',
      listItems: airtableDeletedRecordFields,
    },
  ],
};

export const listRecordCommentsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Comment Count', format: 'number' },
    { key: 'offset', label: 'Next Page Offset' },
    {
      key: 'comments',
      label: 'Comments',
      labelKey: 'text',
      listItems: airtableCommentFields,
    },
  ],
};

export const getCurrentUserActionOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'User ID' }],
};

export const createRecordActionOutputSchema: OutputSchema = { fields: airtableRecordFields };

export const updateRecordActionOutputSchema: OutputSchema = { fields: airtableRecordFields };

export const cleanRecordActionOutputSchema: OutputSchema = { fields: airtableRecordFields };

export const findRecordByIdActionOutputSchema: OutputSchema = { fields: airtableRecordFields };

export const uploadFileToColumnActionOutputSchema: OutputSchema = { fields: airtableRecordFields };

export const deleteRecordActionOutputSchema: OutputSchema = { fields: airtableDeletedRecordFields };

export const addCommentToRecordActionOutputSchema: OutputSchema = { fields: airtableCommentFields };

export const findRecordActionOutputSchema: OutputSchema = {
  itemLabel: '{id}',
  fields: [{ key: 'records', label: 'Records', value: '', listItems: airtableRecordFields }],
};

export const findTableByIdActionOutputSchema: OutputSchema = { fields: airtableRawTableFields };

export const findTableActionOutputSchema: OutputSchema = { fields: airtableRawTableFields };

export const createTableActionOutputSchema: OutputSchema = { fields: airtableRawTableFields };

export const createBaseActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Base ID' },
    { key: 'tables', label: 'Tables', listItems: airtableRawTableFields },
  ],
};

export const getBaseSchemaActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [{ key: 'tables', label: 'Tables', value: '', listItems: airtableRawTableFields }],
};

export const findBaseActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [{ key: 'bases', label: 'Bases', value: '', listItems: airtableBaseFields }],
};

export const newRecordTriggerOutputSchema: OutputSchema = { fields: airtableRecordFields };

export const updatedRecordTriggerOutputSchema: OutputSchema = { fields: airtableRecordFields };
