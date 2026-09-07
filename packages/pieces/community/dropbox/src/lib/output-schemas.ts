import { OutputSchema } from '@activepieces/pieces-framework';

const entryFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'ID' },
  { key: 'path_display', label: 'Path' },
  { key: 'path_lower', label: 'Path (Lowercase)' },
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
