import { OutputSchema } from '@activepieces/pieces-framework';

const containerFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Container Name' },
  { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
  { key: 'etag', label: 'ETag' },
  { key: 'publicAccess', label: 'Public Access' },
  { key: 'leaseState', label: 'Lease State' },
  { key: 'deleted', label: 'Deleted', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const blobFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Blob Name' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
  { key: 'createdOn', label: 'Created On', format: 'datetime' },
  { key: 'etag', label: 'ETag' },
  { key: 'accessTier', label: 'Access Tier' },
  { key: 'blobType', label: 'Blob Type' },
  { key: 'versionId', label: 'Version ID' },
  { key: 'snapshot', label: 'Snapshot' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const tagsField: OutputSchema['fields'][number] = {
  key: 'tags',
  label: 'Tags',
  dynamicKey: true,
};

export const listContainersOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'name', label: 'Container Name' },
    {
      key: 'properties',
      label: 'Properties',
      children: [
        { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
        { key: 'etag', label: 'ETag' },
        { key: 'publicAccess', label: 'Public Access' },
        { key: 'leaseState', label: 'Lease State' },
        { key: 'leaseStatus', label: 'Lease Status' },
        { key: 'hasImmutabilityPolicy', label: 'Has Immutability Policy', format: 'boolean' },
        { key: 'hasLegalHold', label: 'Has Legal Hold', format: 'boolean' },
      ],
    },
    { key: 'metadata', label: 'Metadata', dynamicKey: true },
  ],
};

export const createContainerOutputSchema: OutputSchema = {
  fields: [
    { key: 'containerName', label: 'Container Name' },
    { key: 'accountName', label: 'Account Name' },
    { key: 'etag', label: 'ETag' },
    { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
    { key: 'url', label: 'URL', format: 'url' },
  ],
};

export const deleteContainerOutputSchema: OutputSchema = {
  fields: [
    { key: 'containerName', label: 'Container Name' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const listBlobsOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'name', label: 'Blob Name' },
    {
      key: 'properties',
      label: 'Properties',
      children: [
        { key: 'contentLength', label: 'Size', format: 'filesize' },
        { key: 'contentType', label: 'Content Type' },
        { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
        { key: 'createdOn', label: 'Created On', format: 'datetime' },
        { key: 'etag', label: 'ETag' },
        { key: 'accessTier', label: 'Access Tier' },
        { key: 'blobType', label: 'Blob Type' },
        { key: 'leaseState', label: 'Lease State' },
      ],
    },
    { key: 'metadata', label: 'Metadata', dynamicKey: true },
  ],
};

export const createBlobOutputSchema: OutputSchema = {
  fields: [
    { key: 'container', label: 'Container' },
    { key: 'blobName', label: 'Blob Name' },
    { key: 'etag', label: 'ETag' },
    { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
    { key: 'versionId', label: 'Version ID' },
    { key: 'url', label: 'URL', format: 'url' },
  ],
};

export const deleteBlobOutputSchema: OutputSchema = {
  fields: [
    { key: 'container', label: 'Container' },
    { key: 'blobName', label: 'Blob Name' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const addTagsToBlobOutputSchema: OutputSchema = {
  fields: [
    { key: 'container', label: 'Container' },
    { key: 'blobName', label: 'Blob Name' },
    tagsField,
  ],
};

export const findBlobsOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'name', label: 'Blob Name' },
    { key: 'container', label: 'Container' },
    tagsField,
  ],
};

export const aiListContainersOutputSchema: OutputSchema = {
  fields: [
    { key: 'containers', label: 'Containers', labelKey: 'name', listItems: containerFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextContinuationToken', label: 'Next Continuation Token' },
  ],
};

export const aiListBlobsOutputSchema: OutputSchema = {
  fields: [
    { key: 'container', label: 'Container' },
    { key: 'blobs', label: 'Blobs', labelKey: 'name', listItems: blobFields },
    { key: 'prefixes', label: 'Folder Prefixes' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextContinuationToken', label: 'Next Continuation Token' },
  ],
};

export const aiGetBlobPropertiesOutputSchema: OutputSchema = {
  fields: [
    { key: 'container', label: 'Container' },
    { key: 'blobName', label: 'Blob Name' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'contentEncoding', label: 'Content Encoding' },
    { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
    { key: 'createdOn', label: 'Created On', format: 'datetime' },
    { key: 'etag', label: 'ETag' },
    { key: 'accessTier', label: 'Access Tier' },
    { key: 'blobType', label: 'Blob Type' },
    { key: 'versionId', label: 'Version ID' },
    { key: 'tagCount', label: 'Tag Count', format: 'number' },
    { key: 'leaseState', label: 'Lease State' },
    { key: 'archiveStatus', label: 'Archive Status' },
    { key: 'rehydratePriority', label: 'Rehydrate Priority' },
    { key: 'metadata', label: 'Metadata', dynamicKey: true },
  ],
};

export const aiReadBlobOutputSchema: OutputSchema = {
  fields: [
    { key: 'container', label: 'Container' },
    { key: 'blobName', label: 'Blob Name' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
    { key: 'etag', label: 'ETag' },
    { key: 'text', label: 'Text Content' },
    { key: 'truncated', label: 'Text Omitted', format: 'boolean' },
    { key: 'file', label: 'File', format: 'url' },
  ],
};

export const aiWriteBlobOutputSchema: OutputSchema = {
  fields: [
    { key: 'container', label: 'Container' },
    { key: 'blobName', label: 'Blob Name' },
    { key: 'etag', label: 'ETag' },
    { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
    { key: 'versionId', label: 'Version ID' },
    { key: 'url', label: 'URL', format: 'url' },
  ],
};

export const aiCopyBlobOutputSchema: OutputSchema = {
  fields: [
    { key: 'sourceContainer', label: 'Source Container' },
    { key: 'sourceBlobName', label: 'Source Blob Name' },
    { key: 'container', label: 'Destination Container' },
    { key: 'blobName', label: 'Destination Blob Name' },
    { key: 'copyStatus', label: 'Copy Status' },
    { key: 'copyId', label: 'Copy ID' },
    { key: 'etag', label: 'ETag' },
    { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
    { key: 'versionId', label: 'Version ID' },
  ],
};

export const aiDeleteBlobOutputSchema: OutputSchema = deleteBlobOutputSchema;

export const aiBlobTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'container', label: 'Container' },
    { key: 'blobName', label: 'Blob Name' },
    tagsField,
    { key: 'tagCount', label: 'Tag Count', format: 'number' },
  ],
};

export const aiFindBlobsByTagsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'blobs',
      label: 'Blobs',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Blob Name' },
        { key: 'container', label: 'Container' },
        tagsField,
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextContinuationToken', label: 'Next Continuation Token' },
  ],
};

export const aiSetBlobMetadataOutputSchema: OutputSchema = {
  fields: [
    { key: 'container', label: 'Container' },
    { key: 'blobName', label: 'Blob Name' },
    { key: 'metadata', label: 'Metadata', dynamicKey: true },
    { key: 'etag', label: 'ETag' },
    { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
  ],
};

export const aiSetAccessTierOutputSchema: OutputSchema = {
  fields: [
    { key: 'container', label: 'Container' },
    { key: 'blobName', label: 'Blob Name' },
    { key: 'requestedTier', label: 'Requested Tier' },
    { key: 'accessTier', label: 'Current Access Tier' },
    { key: 'archiveStatus', label: 'Archive Status' },
    { key: 'rehydratePriority', label: 'Rehydrate Priority' },
  ],
};

export const aiGenerateSasUrlOutputSchema: OutputSchema = {
  fields: [
    { key: 'container', label: 'Container' },
    { key: 'blobName', label: 'Blob Name' },
    { key: 'url', label: 'SAS URL', format: 'url' },
    { key: 'expiresAt', label: 'Expires At', format: 'datetime' },
    { key: 'permissions', label: 'Permissions' },
  ],
};

export const newOrUpdatedBlobOutputSchema: OutputSchema = {
  fields: [{ key: 'container', label: 'Container' }, ...blobFields],
};
