import { OutputSchema } from '@activepieces/pieces-framework';

const imageFields: OutputSchema['fields'] = [
  { key: 'name', label: 'File Name' },
  { key: 'alt', label: 'Alt Text' },
  { key: 'mime', label: 'MIME Type' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'width', label: 'Width', format: 'number' },
  { key: 'height', label: 'Height', format: 'number' },
  { key: 'uploadDate', label: 'Uploaded At', format: 'datetime' },
];

const fileFields: OutputSchema['fields'] = [
  { key: 'name', label: 'File Name' },
  { key: 'mime', label: 'MIME Type' },
  { key: 'ext', label: 'Extension' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'uploadDate', label: 'Uploaded At', format: 'datetime' },
];

const warningField: OutputSchema['fields'][number] = {
  key: 'warning',
  label: 'Warning',
  description: 'Set when the file was uploaded but a follow-up change (such as alt text) failed.',
};

const collectionField: OutputSchema['fields'][number] = {
  key: 'collection',
  label: 'Collection',
  description: 'The collection ID the object belongs to.',
};

const objectIdField: OutputSchema['fields'][number] = {
  key: 'id',
  label: 'Object ID',
  description: 'The object ID (URL slug). Use it to read or change this object in a later step.',
};

const blogPostFields: OutputSchema['fields'] = [
  collectionField,
  { key: 'id', label: 'Post ID', description: 'The post ID (URL slug).' },
  { key: 'title', label: 'Title' },
  { key: 'date', label: 'Date', format: 'datetime' },
  { key: 'author', label: 'Author' },
  { key: 'draft', label: 'Draft', format: 'boolean' },
  { key: 'featured', label: 'Featured', format: 'boolean' },
  { key: 'summary', label: 'Summary', format: 'html' },
  { key: 'content', label: 'Content', format: 'html' },
  { key: 'extra', label: 'Extra Content', format: 'html' },
  { key: 'media', label: 'Media URL', format: 'url' },
  { key: 'categories', label: 'Categories' },
  { key: 'tags', label: 'Tags' },
  { key: 'image', label: 'Image', children: imageFields },
  { key: 'gallery', label: 'Gallery', labelKey: 'name', listItems: imageFields },
  { key: 'created', label: 'Created At', format: 'datetime' },
  { key: 'updated', label: 'Updated At', format: 'datetime' },
];

const genericObjectFields: OutputSchema['fields'] = [
  collectionField,
  objectIdField,
  {
    key: 'object',
    label: 'Fields',
    dynamicKey: true,
    description: 'All fields of the object, keyed by field name. The names depend on the collection schema.',
  },
];

const previewField: OutputSchema['fields'][number] = {
  key: 'preview_url',
  label: 'Preview URL',
  format: 'url',
  description: 'A resized preview of the uploaded image, when Total CMS returns one.',
};

export const totalcmsOutputSchemas = {
  blogPost: { fields: blogPostFields },
  savedBlogPost: {
    fields: [
      { key: 'result', label: 'Result', description: 'created when a new post was made, updated when an existing post was changed.' },
      ...blogPostFields,
    ],
  },
  blogPostUpload: { fields: [...blogPostFields, previewField, warningField] },
  object: { fields: genericObjectFields },
  text: { fields: [collectionField, objectIdField, { key: 'text', label: 'Text' }] },
  toggle: { fields: [collectionField, objectIdField, { key: 'status', label: 'On', format: 'boolean' }] },
  date: { fields: [collectionField, objectIdField, { key: 'date', label: 'Date', format: 'datetime' }] },
  image: {
    fields: [collectionField, objectIdField, { key: 'image', label: 'Image', children: imageFields }, previewField, warningField],
  },
  gallery: {
    fields: [
      collectionField,
      objectIdField,
      { key: 'gallery', label: 'Gallery Images', labelKey: 'name', listItems: imageFields },
      previewField,
      warningField,
    ],
  },
  file: {
    fields: [collectionField, objectIdField, { key: 'file', label: 'File', children: fileFields }],
  },
  depot: {
    fields: [
      collectionField,
      objectIdField,
      {
        key: 'depot',
        label: 'Depot',
        children: [
          {
            key: 'files',
            label: 'Files and Folders',
            labelKey: 'name',
            listItems: [
              ...fileFields,
              { key: 'files', label: 'Folder Contents', description: 'Files inside this entry when it is a folder.' },
            ],
          },
        ],
      },
    ],
  },
  video: {
    fields: [
      collectionField,
      objectIdField,
      {
        key: 'video',
        label: 'Video',
        children: [
          { key: 'url', label: 'Video URL', format: 'url' },
          { key: 'provider', label: 'Provider' },
          { key: 'videoId', label: 'Provider Video ID' },
          { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
          { key: 'title', label: 'Title' },
          { key: 'aspectRatio', label: 'Aspect Ratio' },
        ],
      },
    ],
  },
  upload: {
    fields: [
      ...genericObjectFields,
      { key: 'field', label: 'Field', description: 'The field the file was saved to.' },
      previewField,
    ],
  },
  collections: {
    fields: [
      {
        key: 'collections',
        label: 'Collections',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Collection ID' },
          { key: 'name', label: 'Name' },
          { key: 'schema', label: 'Schema' },
          { key: 'description', label: 'Description' },
          { key: 'object_count', label: 'Objects', format: 'number' },
          { key: 'label_singular', label: 'Singular Label' },
          { key: 'label_plural', label: 'Plural Label' },
          { key: 'singleton', label: 'Single Object', format: 'boolean' },
          { key: 'last_updated', label: 'Last Updated', format: 'datetime' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  schema: {
    fields: [
      collectionField,
      { key: 'schema', label: 'Schema ID' },
      { key: 'description', label: 'Description' },
      {
        key: 'fields',
        label: 'Fields',
        labelKey: 'key',
        listItems: [
          { key: 'key', label: 'Field Name' },
          { key: 'label', label: 'Label' },
          { key: 'field_type', label: 'Field Type' },
          { key: 'data_type', label: 'Data Type' },
          { key: 'required', label: 'Required', format: 'boolean' },
          { key: 'in_index', label: 'Returned by Find Objects', format: 'boolean' },
          { key: 'help', label: 'Help Text' },
        ],
      },
    ],
  },
  find: {
    fields: [
      {
        key: 'objects',
        label: 'Objects',
        description: 'Matching objects with their index fields. Long fields such as blog content are not included; use Get Object for those.',
      },
      { key: 'count', label: 'Returned', format: 'number' },
      { key: 'total', label: 'Total Matches', format: 'number' },
      { key: 'offset', label: 'Offset', format: 'number' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
      { key: 'next_offset', label: 'Next Offset', format: 'number', description: 'Pass this as Offset to get the next page. Empty when there are no more.' },
    ],
  },
  number: {
    fields: [
      collectionField,
      objectIdField,
      { key: 'field', label: 'Field' },
      { key: 'value', label: 'New Value', format: 'number' },
    ],
  },
  deleted: {
    fields: [
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      collectionField,
      objectIdField,
    ],
  },
} satisfies Record<string, OutputSchema>;
