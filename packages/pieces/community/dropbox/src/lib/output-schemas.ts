import { OutputSchema } from '@activepieces/pieces-framework';

const entryFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'ID' },
  { key: 'path_display', label: 'Path' },
  { key: 'path_lower', label: 'Path (Lowercase)' },
];

const relocationEntryFields: OutputSchema['fields'] = [
  { key: "['.tag']", label: 'Outcome' },
  { key: 'success.name', label: 'Name' },
  { key: 'success.id', label: 'ID' },
  { key: 'success.path_display', label: 'Path' },
  { key: "failure['.tag']", label: 'Failure Reason' },
];

const batchEntryFields: OutputSchema['fields'] = [
  { key: "['.tag']", label: 'Outcome' },
  { key: 'metadata.name', label: 'Name' },
  { key: 'metadata.id', label: 'ID' },
  { key: 'metadata.path_display', label: 'Path' },
  { key: "failure['.tag']", label: 'Failure Reason' },
];

const fileFields: OutputSchema['fields'] = [
  ...entryFields,
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'client_modified', label: 'Client Modified', format: 'datetime' },
  { key: 'server_modified', label: 'Server Modified', format: 'datetime' },
  { key: 'rev', label: 'Revision' },
  { key: 'content_hash', label: 'Content Hash' },
  { key: 'is_downloadable', label: 'Is Downloadable', format: 'boolean' },
];

export const uploadedFileOutputSchema: OutputSchema = { fields: fileFields };

export const fileMetadataOutputSchema: OutputSchema = {
  fields: [{ key: 'metadata', label: 'File', children: fileFields }],
};

export const folderMetadataOutputSchema: OutputSchema = {
  fields: [{ key: 'metadata', label: 'Folder', children: entryFields }],
};

export const entryOperationOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'metadata',
      label: 'Entry',
      children: [
        {
          key: "['.tag']",
          label: 'Kind',
          description: 'Either file or folder. The fields below are only present for files.',
        },
        ...entryFields,
        { key: 'size', label: 'Size', format: 'filesize' },
        { key: 'client_modified', label: 'Client Modified', format: 'datetime' },
        { key: 'server_modified', label: 'Server Modified', format: 'datetime' },
        { key: 'rev', label: 'Revision' },
        { key: 'content_hash', label: 'Content Hash' },
      ],
    },
  ],
};

export const getFileLinkOutputSchema: OutputSchema = {
  fields: [
    { key: 'link', label: 'Temporary Link', format: 'url' },
    { key: 'metadata', label: 'File', children: fileFields },
  ],
};

export const downloadFileOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'file',
      label: 'File',
      format: 'url',
      description: 'Signed download URL for the retrieved file.',
    },
  ],
};

export const listFolderOutputSchema: OutputSchema = {
  fields: [
    { key: 'entries', label: 'Entries', labelKey: 'name', listItems: entryFields },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'cursor', label: 'Cursor' },
  ],
};

export const searchOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'matches',
      label: 'Matches',
      labelKey: 'metadata.metadata.name',
      listItems: entryFields.map((field) => ({
        ...field,
        value: `metadata.metadata.${field.value ?? field.key}`,
      })),
    },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};

export const newFolderTriggerOutputSchema: OutputSchema = { fields: entryFields };

export const entryMetadataOutputSchema: OutputSchema = {
  fields: [{ key: "['.tag']", label: 'Kind' }, ...fileFields],
};

export const listRevisionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'is_deleted', label: 'Is Deleted', format: 'boolean' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'entries', label: 'Revisions', labelKey: 'rev', listItems: fileFields },
  ],
};

export const copyReferenceOutputSchema: OutputSchema = {
  fields: [
    { key: 'copy_reference', label: 'Copy Reference' },
    { key: 'expires', label: 'Expires', format: 'datetime' },
    { key: 'metadata', label: 'Entry', children: fileFields },
  ],
};

export const lockResultOutputSchema: OutputSchema = {
  fields: [
    { key: "['.tag']", label: 'Outcome' },
    { key: "lock.content['.tag']", label: 'Lock State' },
    {
      key: 'metadata',
      label: 'File',
      children: [
        ...fileFields,
        {
          key: 'file_lock_info',
          label: 'Lock Details',
          children: [
            { key: 'is_lockholder', label: 'Is Lock Holder', format: 'boolean' },
            { key: 'lockholder_name', label: 'Lock Holder' },
            { key: 'created', label: 'Locked At', format: 'datetime' },
          ],
        },
      ],
    },
  ],
};

export const uploadLinkOutputSchema: OutputSchema = {
  fields: [{ key: 'link', label: 'Upload Link', format: 'url' }],
};

export const thumbnailBatchOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'entries',
      label: 'Thumbnails',
      labelKey: 'metadata.name',
      listItems: [
        { key: 'metadata.name', label: 'Name' },
        { key: 'metadata.path_display', label: 'Path' },
        { key: 'thumbnail', label: 'Thumbnail (base64)' },
      ],
    },
  ],
};

export const zipDownloadOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'Zip Archive', format: 'url' },
    { key: 'metadata', label: 'Folder', children: entryFields },
  ],
};

export const filePreviewOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'Preview', format: 'url' },
    { key: 'metadata', label: 'File', children: fileFields },
  ],
};

export const fileThumbnailOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'Thumbnail', format: 'url' },
    {
      key: 'metadata.file_metadata',
      label: 'File',
      children: fileFields,
    },
  ],
};

export const saveUrlLaunchOutputSchema: OutputSchema = {
  fields: [
    { key: "['.tag']", label: 'Result' },
    { key: 'async_job_id', label: 'Async Job ID' },
    ...fileFields,
  ],
};

export const saveUrlStatusOutputSchema: OutputSchema = {
  fields: [{ key: "['.tag']", label: 'Status' }, ...fileFields],
};

export const relocationLaunchOutputSchema: OutputSchema = {
  fields: [
    { key: "['.tag']", label: 'Result' },
    { key: 'async_job_id', label: 'Async Job ID' },
    { key: 'entries', label: 'Entries', labelKey: "['.tag']", listItems: relocationEntryFields },
  ],
};

export const relocationStatusOutputSchema: OutputSchema = {
  fields: [
    { key: "['.tag']", label: 'Status' },
    { key: 'entries', label: 'Entries', labelKey: "['.tag']", listItems: relocationEntryFields },
  ],
};

export const deleteBatchLaunchOutputSchema: OutputSchema = {
  fields: [
    { key: "['.tag']", label: 'Result' },
    { key: 'async_job_id', label: 'Async Job ID' },
    { key: 'entries', label: 'Entries', labelKey: "['.tag']", listItems: batchEntryFields },
  ],
};

export const deleteBatchStatusOutputSchema: OutputSchema = {
  fields: [
    { key: "['.tag']", label: 'Status' },
    { key: 'entries', label: 'Entries', labelKey: "['.tag']", listItems: batchEntryFields },
  ],
};

export const createFolderBatchLaunchOutputSchema: OutputSchema = {
  fields: [
    { key: "['.tag']", label: 'Result' },
    { key: 'async_job_id', label: 'Async Job ID' },
    { key: 'entries', label: 'Entries', labelKey: "['.tag']", listItems: batchEntryFields },
  ],
};

export const createFolderBatchStatusOutputSchema: OutputSchema = {
  fields: [
    { key: "['.tag']", label: 'Status' },
    { key: 'entries', label: 'Entries', labelKey: "['.tag']", listItems: batchEntryFields },
  ],
};




