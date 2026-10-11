import { OutputSchema } from '@activepieces/pieces-framework';

const envelopeFields: OutputSchema['fields'] = [
  { key: 'success', label: 'Success', format: 'boolean' },
  { key: 'code', label: 'Code', format: 'number' },
  { key: 'message', label: 'Message' },
];

const createdRecordFields: OutputSchema['fields'] = [
  { key: 'recordId', label: 'Record ID' },
  { key: 'fields', label: 'Fields', dynamicKey: true },
];

const recordFields: OutputSchema['fields'] = [
  { key: 'recordId', label: 'Record ID' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  { key: 'fields', label: 'Fields', dynamicKey: true },
];

const datasheetFieldFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Field ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'editable', label: 'Editable', format: 'boolean' },
  { key: 'isPrimary', label: 'Primary Field', format: 'boolean' },
  {
    key: 'property',
    label: 'Property',
    children: [
      { key: 'defaultValue', label: 'Default Value' },
      {
        key: 'options',
        label: 'Options',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          {
            key: 'color',
            label: 'Color',
            children: [
              { key: 'name', label: 'Name' },
              { key: 'value', label: 'Value' },
            ],
          },
        ],
      },
    ],
  },
];

const nodeSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Node ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'icon', label: 'Icon' },
  { key: 'isFav', label: 'Favorite', format: 'boolean' },
  { key: 'permission', label: 'Permission', format: 'number' },
];

export const createRecordActionOutputSchema: OutputSchema = {
  fields: [
    ...envelopeFields,
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'records',
          label: 'Records',
          labelKey: 'recordId',
          listItems: createdRecordFields,
        },
      ],
    },
  ],
};

export const updateRecordActionOutputSchema: OutputSchema = {
  fields: [
    ...envelopeFields,
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'records',
          label: 'Records',
          labelKey: 'recordId',
          listItems: recordFields,
        },
      ],
    },
  ],
};

export const findRecordActionOutputSchema: OutputSchema = {
  fields: [
    ...envelopeFields,
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'total', label: 'Total', format: 'number' },
        { key: 'pageNum', label: 'Page Number', format: 'number' },
        { key: 'pageSize', label: 'Page Size', format: 'number' },
        {
          key: 'records',
          label: 'Records',
          labelKey: 'recordId',
          listItems: recordFields,
        },
      ],
    },
  ],
};

export const listSpacesActionOutputSchema: OutputSchema = {
  fields: [
    ...envelopeFields,
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'spaces',
          label: 'Spaces',
          labelKey: 'name',
          listItems: [
            { key: 'id', label: 'Space ID' },
            { key: 'name', label: 'Name' },
            { key: 'isAdmin', label: 'Is Admin', format: 'boolean' },
          ],
        },
      ],
    },
  ],
};

export const listDatasheetsActionOutputSchema: OutputSchema = {
  fields: [
    ...envelopeFields,
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'nodes',
          label: 'Datasheets',
          labelKey: 'name',
          listItems: [...nodeSummaryFields, { key: 'parentId', label: 'Parent ID' }],
        },
      ],
    },
  ],
};

export const searchNodesActionOutputSchema: OutputSchema = {
  fields: [
    ...envelopeFields,
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'nodes',
          label: 'Nodes',
          labelKey: 'name',
          listItems: [...nodeSummaryFields, { key: 'parentId', label: 'Parent ID' }],
        },
      ],
    },
  ],
};

export const getNodeDetailsActionOutputSchema: OutputSchema = {
  fields: [
    ...envelopeFields,
    {
      key: 'data',
      label: 'Node',
      children: [
        ...nodeSummaryFields,
        {
          key: 'children',
          label: 'Children',
          labelKey: 'name',
          listItems: nodeSummaryFields,
        },
      ],
    },
  ],
};

export const listViewsActionOutputSchema: OutputSchema = {
  fields: [
    ...envelopeFields,
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'views',
          label: 'Views',
          labelKey: 'name',
          listItems: [
            { key: 'id', label: 'View ID' },
            { key: 'name', label: 'Name' },
            { key: 'type', label: 'Type' },
          ],
        },
      ],
    },
  ],
};

export const getDatasheetFieldsActionOutputSchema: OutputSchema = {
  fields: [
    ...envelopeFields,
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'fields',
          label: 'Fields',
          labelKey: 'name',
          listItems: datasheetFieldFields,
        },
      ],
    },
  ],
};

export const uploadAttachmentActionOutputSchema: OutputSchema = {
  fields: [
    ...envelopeFields,
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'token', label: 'Token' },
        { key: 'name', label: 'File Name' },
        { key: 'mimeType', label: 'MIME Type' },
        { key: 'size', label: 'Size', format: 'filesize' },
        { key: 'width', label: 'Width', format: 'number' },
        { key: 'height', label: 'Height', format: 'number' },
        { key: 'url', label: 'URL', format: 'url' },
      ],
    },
  ],
};

export const deleteRecordActionOutputSchema: OutputSchema = {
  fields: envelopeFields,
};

export const newRecordTriggerOutputSchema: OutputSchema = {
  fields: recordFields,
};
