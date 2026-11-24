import { OutputSchema } from '@activepieces/pieces-framework';

const fileFields: OutputSchema['fields'] = [
  { key: 'key', label: 'File Key' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
  { key: 'etag', label: 'ETag' },
  { key: 'storageClass', label: 'Storage Class' },
];

export const backblazeUploadFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'fileName', label: 'File Key' },
    { key: 'etag', label: 'ETag' },
    { key: 'url', label: 'URL', format: 'url' },
  ],
};

export const backblazeNewFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'Key', label: 'File Key' },
    { key: 'LastModified', label: 'Last Modified', format: 'datetime' },
    { key: 'ETag', label: 'ETag' },
    { key: 'Size', label: 'Size', format: 'filesize' },
    { key: 'StorageClass', label: 'Storage Class' },
  ],
};

export const backblazeListFilesOutputSchema: OutputSchema = {
  fields: [
    { key: 'files', label: 'Files', labelKey: 'key', listItems: fileFields },
    { key: 'folders', label: 'Folders' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'isTruncated', label: 'Has More', format: 'boolean' },
    { key: 'nextContinuationToken', label: 'Next Continuation Token' },
  ],
};

export const backblazeGetFileMetadataOutputSchema: OutputSchema = {
  fields: [
    { key: 'key', label: 'File Key' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'etag', label: 'ETag' },
    { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
    { key: 'versionId', label: 'Version ID' },
    { key: 'metadata', label: 'Custom Metadata', dynamicKey: true },
  ],
};

export const backblazeReadFileAiOutputSchema: OutputSchema = {
  fields: [
    { key: 'key', label: 'File Key' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'content', label: 'Text Content' },
    { key: 'file', label: 'File', format: 'url' },
  ],
};

export const backblazeUploadFileAiOutputSchema: OutputSchema = {
  fields: [
    { key: 'key', label: 'File Key' },
    { key: 'etag', label: 'ETag' },
    { key: 'versionId', label: 'Version ID' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'contentType', label: 'Content Type' },
  ],
};

export const backblazeCopyFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'sourceKey', label: 'Source File Key' },
    { key: 'destinationKey', label: 'Destination File Key' },
    { key: 'etag', label: 'ETag' },
    { key: 'versionId', label: 'Version ID' },
  ],
};

export const backblazeDeleteFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'key', label: 'File Key' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'versionId', label: 'Version ID' },
  ],
};
