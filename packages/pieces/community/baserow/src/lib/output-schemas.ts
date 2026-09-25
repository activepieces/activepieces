import { OutputSchema } from '@activepieces/pieces-framework';

const rowFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Row ID', format: 'number' },
  { key: 'order', label: 'Order' },
  { key: 'fields', label: 'Row Fields', value: '', dynamicKey: true },
];

const rowChangeFields: OutputSchema['fields'] = [
  { key: 'row', label: 'Row', children: rowFields },
  { key: 'previous', label: 'Previous Row', children: rowFields },
];

const rowListFields: OutputSchema['fields'] = [
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'rows', label: 'Rows', labelKey: 'id', listItems: rowFields },
];

const tableFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Table ID', format: 'number' },
  { key: 'name', label: 'Table Name' },
  { key: 'order', label: 'Order', format: 'number' },
  { key: 'database_id', label: 'Database ID', format: 'number' },
];

const selectOptionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Option ID', format: 'number' },
  { key: 'value', label: 'Value' },
];

const fieldDefinitionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Field ID', format: 'number' },
  { key: 'table_id', label: 'Table ID', format: 'number' },
  { key: 'name', label: 'Field Name' },
  { key: 'type', label: 'Field Type' },
  { key: 'primary', label: 'Primary', format: 'boolean' },
  { key: 'read_only', label: 'Read Only', format: 'boolean' },
  { key: 'description', label: 'Description' },
  {
    key: 'select_options',
    label: 'Select Options',
    labelKey: 'value',
    listItems: [...selectOptionFields, { key: 'color', label: 'Color' }],
  },
];

export const rowOutputSchema: OutputSchema = { fields: rowFields };

export const listRowsOutputSchema: OutputSchema = { fields: rowListFields };

export const listRowsAiOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Total Matching Rows', format: 'number' },
    { key: 'has_more', label: 'Has More Pages', format: 'boolean' },
    { key: 'rows', label: 'Rows', labelKey: 'id', listItems: rowFields },
  ],
};

export const findRowOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'count', label: 'Match Count', format: 'number' },
    ...rowFields,
  ],
};

export const findRowAiOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'count', label: 'Match Count', format: 'number' },
    { key: 'row', label: 'Row', children: rowFields },
  ],
};

export const upsertRowOutputSchema: OutputSchema = {
  fields: [
    { key: 'action', label: 'Action Taken' },
    { key: 'row', label: 'Row', children: rowFields },
  ],
};

export const batchRowsOutputSchema: OutputSchema = { fields: rowListFields };

export const deleteRowOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const deleteRowAiOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'table_id', label: 'Table ID', format: 'number' },
    { key: 'row_id', label: 'Row ID', format: 'number' },
  ],
};

export const batchDeleteRowsOutputSchema: OutputSchema = {
  fields: [{ key: 'deleted_count', label: 'Deleted Count', format: 'number' }],
};

export const batchDeleteRowsAiOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'count', label: 'Deleted Count', format: 'number' },
    { key: 'row_ids', label: 'Deleted Row IDs' },
  ],
};

export const aggregateFieldOutputSchema: OutputSchema = {
  fields: [{ key: 'result', label: 'Result' }],
};

export const aggregateFieldAiOutputSchema: OutputSchema = {
  fields: [
    { key: 'aggregation_type', label: 'Aggregation Type' },
    { key: 'value', label: 'Value' },
  ],
};

export const uploadFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'File Name', description: 'Pass as [{"name": "<this value>"}] to a file field.' },
    { key: 'original_name', label: 'Original Name' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'mime_type', label: 'MIME Type' },
    { key: 'is_image', label: 'Is Image', format: 'boolean' },
    { key: 'image_width', label: 'Image Width', format: 'number' },
    { key: 'image_height', label: 'Image Height', format: 'number' },
    { key: 'uploaded_at', label: 'Uploaded At', format: 'datetime' },
    { key: 'thumbnails', label: 'Thumbnails', dynamicKey: true },
  ],
};

export const listTablesOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'tables',
      label: 'Tables',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Table ID', format: 'number' },
        { key: 'name', label: 'Table Name' },
        { key: 'database_id', label: 'Database ID', format: 'number' },
      ],
    },
  ],
};

export const getTableFieldsOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'fields',
      label: 'Fields',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Field ID', format: 'number' },
        { key: 'name', label: 'Field Name' },
        { key: 'type', label: 'Field Type' },
        { key: 'primary', label: 'Primary', format: 'boolean' },
        { key: 'read_only', label: 'Read Only', format: 'boolean' },
        { key: 'select_options', label: 'Select Options', labelKey: 'value', listItems: selectOptionFields },
        { key: 'link_row_table_id', label: 'Linked Table ID', format: 'number' },
      ],
    },
  ],
};

export const listViewsOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'views',
      label: 'Views',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'View ID', format: 'number' },
        { key: 'name', label: 'View Name' },
        { key: 'type', label: 'View Type' },
      ],
    },
  ],
};

export const listWorkspacesOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'workspaces',
      label: 'Workspaces',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Workspace ID', format: 'number' },
        { key: 'name', label: 'Workspace Name' },
        { key: 'permissions', label: 'Permission Level' },
      ],
    },
  ],
};

export const listDatabasesOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'databases',
      label: 'Databases',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Database ID', format: 'number' },
        { key: 'name', label: 'Database Name' },
        { key: 'workspace_id', label: 'Workspace ID', format: 'number' },
        { key: 'workspace_name', label: 'Workspace Name' },
        {
          key: 'tables',
          label: 'Tables',
          labelKey: 'name',
          listItems: [
            { key: 'id', label: 'Table ID', format: 'number' },
            { key: 'name', label: 'Table Name' },
          ],
        },
      ],
    },
  ],
};

export const createDatabaseOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Database ID', format: 'number' },
    { key: 'name', label: 'Database Name' },
    {
      key: 'workspace',
      label: 'Workspace',
      children: [
        { key: 'id', label: 'Workspace ID', format: 'number' },
        { key: 'name', label: 'Workspace Name' },
      ],
    },
  ],
};

export const tableOutputSchema: OutputSchema = { fields: tableFields };

export const createTableOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Table ID', format: 'number' },
    { key: 'name', label: 'Table Name' },
    { key: 'database_id', label: 'Database ID', format: 'number' },
  ],
};

export const deleteTableOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'table_id', label: 'Table ID', format: 'number' },
  ],
};

export const fieldOutputSchema: OutputSchema = { fields: fieldDefinitionFields };

export const deleteFieldOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'field_id', label: 'Field ID', format: 'number' },
    { key: 'related_fields', label: 'Related Fields Changed', labelKey: 'name', listItems: fieldDefinitionFields },
  ],
};

export const getFieldUniqueValuesOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'values', label: 'Values' },
  ],
};

export const listRowNamesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Rows',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Row ID', format: 'number' },
        { key: 'name', label: 'Name' },
      ],
    },
  ],
};

export const getRowHistoryOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Total Entries', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    {
      key: 'entries',
      label: 'Entries',
      labelKey: 'timestamp',
      listItems: [
        { key: 'id', label: 'Entry ID', format: 'number' },
        { key: 'action_type', label: 'Action Type' },
        { key: 'timestamp', label: 'Changed At', format: 'datetime' },
        {
          key: 'user',
          label: 'Changed By',
          children: [
            { key: 'id', label: 'User ID', format: 'number' },
            { key: 'name', label: 'Name' },
          ],
        },
        { key: 'before', label: 'Before', dynamicKey: true },
        { key: 'after', label: 'After', dynamicKey: true },
      ],
    },
  ],
};

export const searchWorkspaceOutputSchema: OutputSchema = {
  fields: [
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'title',
      listItems: [
        { key: 'type', label: 'Result Type' },
        { key: 'id', label: 'Result ID', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'subtitle', label: 'Subtitle' },
        { key: 'description', label: 'Description' },
        {
          key: 'metadata',
          label: 'Location',
          children: [
            { key: 'workspace_id', label: 'Workspace ID', format: 'number' },
            { key: 'database_id', label: 'Database ID', format: 'number' },
            { key: 'database_name', label: 'Database Name' },
            { key: 'table_id', label: 'Table ID', format: 'number' },
            { key: 'table_name', label: 'Table Name' },
            { key: 'row_id', label: 'Row ID', format: 'number' },
            { key: 'field_id', label: 'Field ID', format: 'number' },
            { key: 'field_name', label: 'Field Name' },
            { key: 'primary_field_value', label: 'Primary Field Value' },
          ],
        },
      ],
    },
  ],
};

export const listWorkspaceUsersOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'users',
      label: 'Users',
      labelKey: 'name',
      listItems: [
        { key: 'user_id', label: 'User ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'permissions', label: 'Role' },
      ],
    },
  ],
};

export const exportTableOutputSchema: OutputSchema = {
  fields: [
    { key: 'job_id', label: 'Export Job ID', format: 'number' },
    { key: 'state', label: 'State' },
  ],
};

export const getExportJobOutputSchema: OutputSchema = {
  fields: [
    { key: 'job_id', label: 'Export Job ID', format: 'number' },
    { key: 'state', label: 'State' },
    { key: 'progress_percentage', label: 'Progress (%)', format: 'number' },
    { key: 'file_name', label: 'File Name' },
    { key: 'url', label: 'Download URL', format: 'url' },
  ],
};

export const createViewOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'View ID', format: 'number' },
    { key: 'name', label: 'View Name' },
    { key: 'type', label: 'View Type' },
    { key: 'table_id', label: 'Table ID', format: 'number' },
  ],
};

export const rowUpdatedTriggerOutputSchema: OutputSchema = { fields: rowChangeFields };

export const rowDeletedTriggerOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Deleted Row ID', format: 'number' }],
};

export const rowEventTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'event_type', label: 'Event Type' },
    { key: 'row', label: 'Row', children: rowFields },
    { key: 'previous_row', label: 'Previous Row', children: rowFields },
  ],
};

export const rowsUpdatedTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'rows', label: 'Rows', listItems: rowChangeFields },
  ],
};

export const rowsDeletedTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'rows',
      label: 'Deleted Rows',
      labelKey: 'id',
      listItems: [{ key: 'id', label: 'Row ID', format: 'number' }],
    },
  ],
};
