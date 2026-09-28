import { OutputSchema } from '@activepieces/pieces-framework';

const nocodbPageInfoFields: OutputSchema['fields'] = [
  { key: 'totalRows', label: 'Total Rows', format: 'number' },
  { key: 'page', label: 'Page', format: 'number' },
  { key: 'pageSize', label: 'Page Size', format: 'number' },
  { key: 'isFirstPage', label: 'Is First Page', format: 'boolean' },
  { key: 'isLastPage', label: 'Is Last Page', format: 'boolean' },
];

const nocodbViewFields: OutputSchema['fields'] = [
  { key: 'id', label: 'View ID' },
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type', format: 'number' },
  { key: 'is_default', label: 'Is Default', format: 'boolean' },
  { key: 'show_system_fields', label: 'Show System Fields', format: 'boolean' },
  { key: 'order', label: 'Order', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'description', label: 'Description' },
];

const nocodbColumnFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Column ID' },
  { key: 'title', label: 'Title' },
  { key: 'column_name', label: 'Column Name' },
  { key: 'uidt', label: 'UI Data Type' },
  { key: 'pk', label: 'Primary Key', format: 'boolean' },
  { key: 'pv', label: 'Primary Value', format: 'boolean' },
  { key: 'rqd', label: 'Required', format: 'boolean' },
  { key: 'system', label: 'System', format: 'boolean' },
  { key: 'readonly', label: 'Readonly', format: 'boolean' },
  { key: 'order', label: 'Order', format: 'number' },
  { key: 'description', label: 'Description' },
];

export const nocodbCreateGridViewOutputSchema: OutputSchema = {
  fields: [
    { key: 'base_id', label: 'Base ID' },
    { key: 'fk_model_id', label: 'Table ID' },
    ...nocodbViewFields,
  ],
};

export const nocodbResultOutputSchema: OutputSchema = {
  fields: [{ key: 'result', label: 'Result', value: '' }],
};

export const nocodbGetCurrentUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'is_api_token', label: 'Is API Token', format: 'boolean' },
    { key: 'is_new_user', label: 'Is New User', format: 'boolean' },
    { key: 'isAuthorized', label: 'Is Authorized', format: 'boolean' },
    { key: 'roles', label: 'Roles', dynamicKey: true },
  ],
};

export const nocodbGetRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'Id', label: 'ID', format: 'number' },
    { key: 'Title', label: 'Title' },
    { key: 'CreatedAt', label: 'Created At', format: 'datetime' },
    { key: 'UpdatedAt', label: 'Updated At', format: 'datetime' },
  ],
};

export const nocodbCreateRecordOutputSchema: OutputSchema = {
  fields: [{ key: 'Id', label: 'ID', format: 'number' }],
};

export const nocodbGetTableSchemaOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Table ID' },
    { key: 'base_id', label: 'Base ID' },
    { key: 'table_name', label: 'Table Name' },
    { key: 'title', label: 'Title' },
    { key: 'enabled', label: 'Enabled', format: 'boolean' },
    { key: 'order', label: 'Order', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'description', label: 'Description' },
    {
      key: 'views',
      label: 'Views',
      labelKey: 'title',
      listItems: nocodbViewFields,
    },
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'title',
      listItems: nocodbColumnFields,
    },
  ],
};

export const nocodbListBasesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'list',
      label: 'List',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'prefix', label: 'Prefix' },
        { key: 'status', label: 'Status' },
        { key: 'description', label: 'Description' },
        { key: 'color', label: 'Color' },
        { key: 'type', label: 'Type' },
        { key: 'default_role', label: 'Default Role' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'last_accessed', label: 'Last Accessed', format: 'datetime' },
      ],
    },
    { key: 'pageInfo', label: 'Page Info', children: nocodbPageInfoFields },
  ],
};

export const nocodbListNotificationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'list',
      label: 'List',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'type', label: 'Type' },
        { key: 'body', label: 'Body' },
        { key: 'is_read', label: 'Is Read', format: 'boolean' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'pageInfo', label: 'Page Info', children: nocodbPageInfoFields },
    { key: 'unreadCount', label: 'Unread Count', format: 'number' },
  ],
};

export const nocodbListViewColumnsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'list',
      label: 'List',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'View Column ID' },
        { key: 'fk_column_id', label: 'Column ID' },
        { key: 'label', label: 'Label' },
        { key: 'show', label: 'Show', format: 'boolean' },
        { key: 'order', label: 'Order', format: 'number' },
      ],
    },
  ],
};

export const nocodbListViewSortsOutputSchema: OutputSchema = {
  fields: [{ key: 'list', label: 'List', value: '' }],
};

export const nocodbListWorkspacesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'list',
      label: 'List',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'status', label: 'Status', format: 'number' },
      ],
    },
    { key: 'pageInfo', label: 'Page Info', children: nocodbPageInfoFields },
  ],
};

export const nocodbSearchRecordsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Found Records',
      value: '',
      listItems: [
        { key: 'Id', label: 'ID', format: 'number' },
        { key: 'Title', label: 'Title' },
        { key: 'CreatedAt', label: 'Created At', format: 'datetime' },
        { key: 'UpdatedAt', label: 'Updated At', format: 'datetime' },
      ],
    },
  ],
  itemLabel: 'Record {Id}',
};

export const nocodbGetSharedViewGroupedDataOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Groups',
      value: '',
      listItems: [
        { key: 'key', label: 'Key' },
        {
          key: 'value',
          label: 'Value',
          children: [
            {
              key: 'list',
              label: 'List',
              listItems: [
                { key: 'Id', label: 'ID', format: 'number' },
                { key: 'Title', label: 'Title' },
              ],
            },
            { key: 'pageInfo', label: 'Page Info', children: nocodbPageInfoFields },
          ],
        },
      ],
    },
  ],
  itemLabel: '{key}',
};

export const nocodbUploadAttachmentByUrlOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Uploaded Files',
      value: '',
      listItems: [
        { key: 'url', label: 'URL', format: 'image' },
        { key: 'title', label: 'Title' },
        { key: 'mimetype', label: 'Mimetype' },
        { key: 'size', label: 'Size', format: 'filesize' },
        { key: 'width', label: 'Width', format: 'number' },
        { key: 'height', label: 'Height', format: 'number' },
        { key: 'signedUrl', label: 'Signed URL', format: 'image' },
      ],
    },
  ],
  itemLabel: '{title}',
};
