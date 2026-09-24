import { OutputSchema } from '@activepieces/pieces-framework';

export const generateContentActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'text',
			label: 'Generated Content',
			value: '',
		},
	],
};

export const chatGeminiActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'response',
      label: 'Response',
      value: 'response',
    },
    {
      key: 'history',
      label: 'Conversation History',
      value: 'history',
      listItems: [
        {
          key: 'role',
          label: 'Role',
          value: 'role',
        },
        {
          key: 'text',
          label: 'Text',
          value: 'parts[0].text',
        },
      ],
    },
  ],
};

export const generateContentFromImageActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'text',
      label: 'Generated Text',
      value: 'text',
    },
    {
      key: 'modelVersion',
      label: 'Model Version',
      value: 'raw.modelVersion',
    },
    {
      key: 'finishReason',
      label: 'Finish Reason',
      value: 'raw.candidates[0].finishReason',
    },
    {
      key: 'candidates',
      label: 'Candidates',
      value: 'raw.candidates',
      listItems: [
        {
          key: 'text',
          label: 'Text',
          value: 'content.parts[0].text',
        },
        {
          key: 'role',
          label: 'Role',
          value: 'content.role',
        },
        {
          key: 'finishReason',
          label: 'Finish Reason',
          value: 'finishReason',
        },
      ],
    },
    {
      key: 'usageMetadata',
      label: 'Usage Metadata',
      value: 'raw.usageMetadata',
      children: [
        {
          key: 'promptTokenCount',
          label: 'Prompt Tokens',
          value: 'promptTokenCount',
          format: 'number',
        },
        {
          key: 'candidatesTokenCount',
          label: 'Candidates Tokens',
          value: 'candidatesTokenCount',
          format: 'number',
        },
        {
          key: 'totalTokenCount',
          label: 'Total Tokens',
          value: 'totalTokenCount',
          format: 'number',
        },
        {
          key: 'serviceTier',
          label: 'Service Tier',
          value: 'serviceTier',
        },
      ],
    },
  ],
};

export const generateContentWithFilesearchActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'text',
      label: 'Generated Content',
      value: '',
    },
  ],
};

export const textToSpeechActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'audioFile',
      label: 'Audio File URL',
      value: '',
      format: 'url',
    },
  ],
};

export const createVideoActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'videoFile',
      label: 'Video File URL',
      value: '',
      format: 'url',
    },
  ],
};

export const generateImageActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'imageFile',
      label: 'Image File URL',
      value: '',
      format: 'url',
    },
  ],
};

export const listModelsActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'models',
      label: 'Models',
      value: '',
      listItems: [
        { key: 'name', label: 'Model Name' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'description', label: 'Description' },
        { key: 'version', label: 'Version' },
        { key: 'inputTokenLimit', label: 'Input Token Limit', format: 'number' },
        { key: 'outputTokenLimit', label: 'Output Token Limit', format: 'number' },
        { key: 'supportedGenerationMethods', label: 'Supported Methods' },
      ],
    },
  ],
};

export const generateEmbeddingsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'embedding',
      label: 'Embedding Vector',
    },
    {
      key: 'dimensions',
      label: 'Dimensions',
      format: 'number',
    },
  ],
};

export const countTokensActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'totalTokens',
      label: 'Total Tokens',
      format: 'number',
    },
    {
      key: 'cachedContentTokenCount',
      label: 'Cached Content Token Count',
      format: 'number',
    },
  ],
};
