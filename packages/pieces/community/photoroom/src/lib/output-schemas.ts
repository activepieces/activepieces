import { OutputSchema } from '@activepieces/pieces-framework';

const generatedFileFields: OutputSchema['fields'] = [
  { key: 'fileName', label: 'File Name' },
  { key: 'url', label: 'File URL', format: 'url' },
];

const uncertaintyScoreField: OutputSchema['fields'][number] = {
  key: 'uncertaintyScore',
  label: 'Uncertainty Score',
  format: 'number',
  description:
    'Confidence of the segmentation between 0 and 1; higher means less confident. Set to -1 for images containing humans. Absent when the API does not return it.',
};

const aiBackgroundSeedField: OutputSchema['fields'][number] = {
  key: 'aiBackgroundSeed',
  label: 'AI Background Seed',
  format: 'number',
  description:
    'Seed used by the AI generation; pass it as the seed input of a later call to reproduce a similar result. Absent when the API does not return it.',
};

export const removeBackgroundOutputSchema: OutputSchema = {
  fields: [...generatedFileFields, uncertaintyScoreField],
};

export const editImageOutputSchema: OutputSchema = {
  fields: [
    ...generatedFileFields,
    uncertaintyScoreField,
    aiBackgroundSeedField,
  ],
};

export const generateImageOutputSchema: OutputSchema = {
  fields: [...generatedFileFields, aiBackgroundSeedField],
};

export const getAccountDetailsOutputSchema: OutputSchema = {
  fields: [
    { key: 'plan', label: 'Plan' },
    {
      key: 'images',
      label: 'Images',
      children: [
        { key: 'available', label: 'Available Images', format: 'number' },
        { key: 'subscription', label: 'Subscription Images', format: 'number' },
      ],
    },
  ],
};
