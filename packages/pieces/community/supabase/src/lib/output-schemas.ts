import { OutputSchema } from '@activepieces/pieces-framework';

export const createRowActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'rows',
            label: 'Created Rows',
            value: '',
            labelKey: 'id',
            listItems: [
                {
                    key: 'created_at',
                    label: 'Created At',
                    value: 'created_at',
                    format: 'datetime',
                },
                {
                    key: 'id',
                    label: 'ID',
                    value: 'id',
                },
            ],
        },
    ],
};

export const searchRowsActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'data',
            label: 'Rows',
            labelKey: 'id',
            listItems: [
                {
                    key: 'id',
                    label: 'ID',
                    value: 'id',
                },
                {
                    key: 'created_at',
                    label: 'Created At',
                    value: 'created_at',
                    format: 'datetime',
                },
            ],
        },
        {
            key: 'count',
            label: 'Count',
            value: 'count',
            format: 'number',
        },
        {
            key: 'page',
            label: 'Page',
            value: 'page',
            format: 'number',
        },
        {
            key: 'pageSize',
            label: 'Page Size',
            value: 'pageSize',
            format: 'number',
        },
        {
            key: 'total_pages',
            label: 'Total Pages',
            value: 'total_pages',
            format: 'number',
        },
        {
            key: 'has_more',
            label: 'Has More',
            value: 'has_more',
            format: 'boolean',
        },
        {
            key: 'range',
            label: 'Range',
            children: [
                {
                    key: 'from',
                    label: 'From',
                    value: 'from',
                    format: 'number',
                },
                {
                    key: 'to',
                    label: 'To',
                    value: 'to',
                    format: 'number',
                },
                {
                    key: 'returned',
                    label: 'Returned',
                    value: 'returned',
                    format: 'number',
                },
            ],
        },
    ],
};

export const listTablesActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'tables',
            label: 'Tables',
            value: '',
            labelKey: 'name',
            listItems: [
                {
                    key: 'name',
                    label: 'Name',
                    value: 'name',
                },
            ],
        },
    ],
};

export const getTableSchemaActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'columns',
            label: 'Columns',
            value: '',
            labelKey: 'column_name',
            listItems: [
                {
                    key: 'column_name',
                    label: 'Column Name',
                    value: 'column_name',
                },
                {
                    key: 'data_type',
                    label: 'Data Type',
                    value: 'data_type',
                },
                {
                    key: 'format',
                    label: 'Format',
                    value: 'format',
                },
                {
                    key: 'description',
                    label: 'Description',
                    value: 'description',
                },
            ],
        },
    ],
};

export const updateRowActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'success',
            label: 'Success',
            value: 'success',
            format: 'boolean',
        },
        {
            key: 'updated_count',
            label: 'Updated Count',
            value: 'updated_count',
            format: 'number',
        },
        {
            key: 'updated_rows',
            label: 'Updated Rows',
            value: 'updated_rows',
            labelKey: 'id',
            listItems: [
                {
                    key: 'id',
                    label: 'ID',
                    value: 'id',
                },
                {
                    key: 'created_at',
                    label: 'Created At',
                    value: 'created_at',
                    format: 'datetime',
                },
            ],
        },
    ],
};

export const upsertRowActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'success',
            label: 'Success',
            value: 'success',
            format: 'boolean',
        },
        {
            key: 'upserted_count',
            label: 'Upserted Count',
            value: 'upserted_count',
            format: 'number',
        },
        {
            key: 'upserted_rows',
            label: 'Upserted Rows',
            value: 'upserted_rows',
            labelKey: 'id',
            listItems: [
                {
                    key: 'id',
                    label: 'ID',
                    value: 'id',
                },
                {
                    key: 'created_at',
                    label: 'Created At',
                    value: 'created_at',
                    format: 'datetime',
                },
            ],
        },
    ],
};

export const deleteRowsActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'success',
            label: 'Success',
            value: 'success',
            format: 'boolean',
        },
        {
            key: 'deleted_count',
            label: 'Deleted Count',
            value: 'deleted_count',
            format: 'number',
        },
        {
            key: 'deleted_rows',
            label: 'Deleted Rows',
            value: 'deleted_rows',
            labelKey: 'id',
            listItems: [
                {
                    key: 'created_at',
                    label: 'Created At',
                    value: 'created_at',
                    format: 'datetime',
                },
                {
                    key: 'id',
                    label: 'ID',
                    value: 'id',
                },
            ],
        },
    ],
};

export const uploadFileActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'publicUrl',
      label: 'Public URL',
      value: 'publicUrl',
      format: 'url',
      description: 'Only opens for public buckets.',
    },
    { key: 'path', label: 'Path', value: 'path' },
    { key: 'fullPath', label: 'Full Path', value: 'fullPath' },
  ],
};

export const createBucketActionOutputSchema: OutputSchema = {
    fields: [
        { key: 'name', label: 'Name', value: 'name' },
    ],
};

export const deleteBucketActionOutputSchema: OutputSchema = {
    fields: [
        { key: 'success', label: 'Success', value: 'success', format: 'boolean' },
    ],
};

export const listBucketsActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'buckets',
            label: 'Buckets',
            value: '',
            labelKey: 'name',
            listItems: [
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Name' },
                { key: 'public', label: 'Public', format: 'boolean' },
                { key: 'created_at', label: 'Created At', format: 'datetime' },
                { key: 'updated_at', label: 'Updated At', format: 'datetime' },
                { key: 'file_size_limit', label: 'File Size Limit (bytes)', format: 'number' },
                { key: 'allowed_mime_types', label: 'Allowed MIME Types' },
            ],
        },
    ],
};

export const listFilesActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'files',
            label: 'Files',
            value: '',
            labelKey: 'name',
            listItems: [
                { key: 'name', label: 'Name' },
                { key: 'id', label: 'ID' },
                { key: 'updated_at', label: 'Updated At', format: 'datetime' },
                { key: 'created_at', label: 'Created At', format: 'datetime' },
                { key: 'last_accessed_at', label: 'Last Accessed At', format: 'datetime' },
                { key: 'size', label: 'Size (bytes)', format: 'number' },
                { key: 'mimetype', label: 'MIME Type' },
            ],
        },
    ],
};

export const downloadFileActionOutputSchema: OutputSchema = {
    fields: [
        { key: 'base64', label: 'File Content (base64)' },
        { key: 'mimeType', label: 'MIME Type' },
        { key: 'size', label: 'Size (bytes)', format: 'number' },
    ],
};

export const deleteFileActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'deleted_files',
            label: 'Deleted Files',
            value: '',
            labelKey: 'name',
            listItems: [
                { key: 'name', label: 'Name' },
            ],
        },
    ],
};

export const createSignedUrlActionOutputSchema: OutputSchema = {
    fields: [
        { key: 'signedUrl', label: 'Signed URL', value: 'signedUrl', format: 'url' },
    ],
};

export const listUsersActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'users',
            label: 'Users',
            value: '',
            labelKey: 'email',
            listItems: [
                { key: 'id', label: 'ID' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'created_at', label: 'Created At', format: 'datetime' },
                { key: 'last_sign_in_at', label: 'Last Sign In At', format: 'datetime' },
                { key: 'confirmed_at', label: 'Confirmed At', format: 'datetime' },
            ],
        },
        { key: 'has_more', label: 'Has More', value: 'has_more', format: 'boolean' },
    ],
};

export const getUserActionOutputSchema: OutputSchema = {
    fields: [
        { key: 'id', label: 'ID' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        {
            key: 'user_metadata',
            label: 'User Metadata',
            value: 'user_metadata',
        },
        {
            key: 'app_metadata',
            label: 'App Metadata',
            value: 'app_metadata',
        },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'last_sign_in_at', label: 'Last Sign In At', format: 'datetime' },
        { key: 'confirmed_at', label: 'Confirmed At', format: 'datetime' },
    ],
};

export const createUserActionOutputSchema: OutputSchema = {
    fields: [
        { key: 'id', label: 'ID' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
    ],
};

export const updateUserActionOutputSchema: OutputSchema = {
    fields: [
        { key: 'id', label: 'ID' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    ],
};

export const deleteUserActionOutputSchema: OutputSchema = {
    fields: [
        { key: 'success', label: 'Success', value: 'success', format: 'boolean' },
    ],
};

export const inviteUserActionOutputSchema: OutputSchema = {
    fields: [
        { key: 'id', label: 'ID' },
        { key: 'email', label: 'Email' },
        { key: 'invited_at', label: 'Invited At', format: 'datetime' },
    ],
};

export const newRowTriggerOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'type',
            label: 'Event Type',
        },
        {
            key: 'table',
            label: 'Table',
        },
        {
            key: 'schema',
            label: 'Schema',
        },
        {
            key: 'record',
            label: 'Record',
            children: [
                {
                    key: 'id',
                    label: 'ID',
                },
                {
                    key: 'created_at',
                    label: 'Created At',
                    format: 'datetime',
                },
            ],
        },
        {
            key: 'old_record',
            label: 'Old Record',
        },
        {
            key: 'timestamp',
            label: 'Timestamp',
            format: 'datetime',
        },
        {
            key: 'raw_payload',
            label: 'Raw Payload',
        },
    ],
};