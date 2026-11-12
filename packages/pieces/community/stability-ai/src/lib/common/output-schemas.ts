import { OutputSchema } from '@activepieces/pieces-framework';

const imageFields: OutputSchema['fields'] = [
  { key: 'fileName', label: 'File Name' },
  { key: 'url', label: 'Image', format: 'image', description: 'The generated image saved in flow storage.' },
  { key: 'mimeType', label: 'MIME Type' },
  { key: 'seed', label: 'Seed', format: 'number' },
  {
    key: 'finishReason',
    label: 'Finish Reason',
    description: 'SUCCESS, or CONTENT_FILTERED when Stability AI blurred the image for moderation (still charged).',
  },
  { key: 'requestId', label: 'Request ID' },
];

export const imageOutputSchema: OutputSchema = {
  fields: imageFields,
};

export const asyncImageOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status', description: 'complete when the image is ready, in-progress while it is still being generated.' },
    { key: 'generationId', label: 'Generation ID', description: 'Pass to Get Generation Result to fetch the image later.' },
    ...imageFields,
  ],
};

export const textToImageOutputSchema: OutputSchema = {
  itemLabel: 'Image {seed}',
  fields: [
    {
      key: 'images',
      label: 'Images',
      value: '',
      listItems: [
        { key: 'image', label: 'Image', format: 'image', description: 'The generated image saved in flow storage. Empty when the sample failed.' },
        { key: 'seed', label: 'Seed', format: 'number' },
        { key: 'finishReason', label: 'Finish Reason', description: 'SUCCESS, CONTENT_FILTERED (blurred, still charged) or ERROR.' },
      ],
    },
  ],
};

export const accountBalanceOutputSchema: OutputSchema = {
  fields: [{ key: 'credits', label: 'Credits', format: 'number' }],
};

export const accountDetailsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'User ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'profilePicture', label: 'Profile Picture', format: 'image' },
    {
      key: 'organizations',
      label: 'Organizations',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Organization ID' },
        { key: 'name', label: 'Name' },
        { key: 'role', label: 'Role' },
        { key: 'isDefault', label: 'Default', format: 'boolean' },
      ],
    },
  ],
};

export const listEnginesOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'engines',
      label: 'Engines',
      value: '',
      listItems: [
        { key: 'id', label: 'Engine ID' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'type', label: 'Type' },
      ],
    },
  ],
};
