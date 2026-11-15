import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const imageFields: OutputSchemaField[] = [
  { key: 'asset_id', label: 'Asset ID', description: 'AltTextify ID of the image record.' },
  { key: 'alt_text', label: 'Alt Text', description: 'Generated alt text as one string.' },
  {
    key: 'alt_texts',
    label: 'Alt Texts',
    description: 'All alt text values stored for the image.',
    listItems: [{ key: 'value', label: 'Alt Text' }],
  },
  { key: 'image_source', label: 'Image Source', description: 'Stored file name of the image.' },
  { key: 'tag', label: 'Tag' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'status', label: 'Status', description: 'Record status such as DELETED, when AltTextify sends one; otherwise empty.' },
];

const generateOutputSchema: OutputSchema = {
  fields: [
    { key: 'asset_id', label: 'Asset ID', description: 'AltTextify ID of the stored image record.' },
    { key: 'job_id', label: 'Job ID', description: 'ID of the generation job returned by AltTextify.' },
    { key: 'alt_text', label: 'Alt Text', description: 'Generated alt text.' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'note', label: 'Note', description: 'Set when the stored record could not be matched.' },
  ],
};

const imageOutputSchema: OutputSchema = { fields: imageFields };

const listImagesOutputSchema: OutputSchema = {
  fields: [
    { key: 'images', label: 'Images', listItems: imageFields, labelKey: 'asset_id' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const deleteImageOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'asset_id', label: 'Asset ID' },
    { key: 'status', label: 'Status', description: 'Status AltTextify reports for the record, such as DELETED.' },
  ],
};

export const alttextifySchemas = {
  generate: generateOutputSchema,
  image: imageOutputSchema,
  listImages: listImagesOutputSchema,
  deleteImage: deleteImageOutputSchema,
};
