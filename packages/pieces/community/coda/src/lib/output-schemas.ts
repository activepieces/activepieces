import { OutputSchema } from '@activepieces/pieces-framework';

const rowFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'Row ID',
    description: 'Use this to read or update the row in a later step.',
  },
  {
    key: 'name',
    label: 'Name',
    description: 'Value of the table\'s display column for this row.',
  },
  {
    key: 'values',
    label: 'Column Values',
    dynamicKey: true,
    labelKey: 'name',
    description:
      'The row\'s cells, keyed by your column names. The keys depend on the table, so they differ from doc to doc.',
  },
  {
    key: 'index',
    label: 'Row Index',
    format: 'number',
    description: 'Zero-based position of the row in the table.',
  },
  {
    key: 'createdAt',
    label: 'Created At',
    format: 'datetime',
  },
  {
    key: 'updatedAt',
    label: 'Updated At',
    format: 'datetime',
  },
  {
    key: 'browserLink',
    label: 'Browser Link',
    format: 'url',
    description: 'Opens the row in Coda.',
  },
];

const tableFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Table ID' },
  { key: 'name', label: 'Name' },
  {
    key: 'tableType',
    label: 'Table Type',
    description: 'Either "table" or "view".',
  },
  {
    key: 'browserLink',
    label: 'Browser Link',
    format: 'url',
    description: 'Opens the table in Coda.',
  },
  {
    key: 'parent',
    label: 'Page',
    description: 'The doc page the table sits on.',
    children: [
      { key: 'id', label: 'Page ID' },
      { key: 'name', label: 'Name' },
      { key: 'browserLink', label: 'Browser Link', format: 'url' },
    ],
  },
];

export const createRowActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rowId',
      label: 'Row ID',
      description:
        'Coda applies row writes asynchronously, so the new row may not be readable for a few seconds. Add a short delay before passing this to Get Row.',
    },
  ],
};

export const updateRowActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rowId',
      label: 'Row ID',
      description: 'The row that was updated.',
    },
  ],
};

export const getRowActionOutputSchema: OutputSchema = {
  fields: [
    ...rowFields,
    {
      key: 'parent',
      label: 'Table',
      children: [
        { key: 'id', label: 'Table ID' },
        { key: 'name', label: 'Name' },
        { key: 'tableType', label: 'Table Type' },
        { key: 'browserLink', label: 'Browser Link', format: 'url' },
      ],
    },
  ],
};

export const findRowActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'found',
      label: 'Found',
      format: 'boolean',
      description: 'False when no row matched, in which case Rows is empty.',
    },
    {
      key: 'result',
      label: 'Rows',
      labelKey: 'name',
      description: 'Every matching row, across all pages of results.',
      listItems: rowFields,
    },
  ],
};

export const listTablesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'found',
      label: 'Found',
      format: 'boolean',
      description: 'False when the doc has no tables, in which case Tables is empty.',
    },
    {
      key: 'result',
      label: 'Tables',
      labelKey: 'name',
      listItems: tableFields,
    },
  ],
};

export const getTableActionOutputSchema: OutputSchema = {
  fields: [
    ...tableFields,
    {
      key: 'rowCount',
      label: 'Row Count',
      format: 'number',
    },
    {
      key: 'displayColumn',
      label: 'Display Column',
      description: 'The column whose value names each row. Coda returns its id only, not its name.',
      children: [{ key: 'id', label: 'Column ID' }],
    },
    {
      key: 'layout',
      label: 'Layout',
      description: 'How the table is laid out in the doc, for example "default".',
    },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  ],
};

export const newRowCreatedTriggerOutputSchema: OutputSchema = { fields: rowFields };
