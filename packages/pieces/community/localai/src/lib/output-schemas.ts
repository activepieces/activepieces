import { OutputSchema } from '@activepieces/pieces-framework';

export const listModelsOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'models',
      label: 'Models',
      labelKey: 'id',
      listItems: [{ key: 'id', label: 'Model ID' }],
    },
  ],
};

export const createEmbeddingOutputSchema: OutputSchema = {
  fields: [
    { key: 'model', label: 'Model' },
    { key: 'dimensions', label: 'Dimensions', format: 'number' },
    { key: 'embedding', label: 'Embedding' },
  ],
};

export const textToSpeechOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'Audio File', format: 'url' },
    { key: 'file_name', label: 'File Name' },
    { key: 'format', label: 'Format' },
    { key: 'size_bytes', label: 'Size', format: 'filesize' },
    { key: 'model', label: 'Model' },
  ],
};

export const transcribeAudioOutputSchema: OutputSchema = {
  fields: [
    { key: 'text', label: 'Text' },
    { key: 'duration', label: 'Duration (Seconds)', format: 'number' },
    {
      key: 'segments',
      label: 'Segments',
      labelKey: 'text',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'start', label: 'Start (Seconds)', format: 'number' },
        { key: 'end', label: 'End (Seconds)', format: 'number' },
        { key: 'text', label: 'Text' },
      ],
    },
  ],
};
