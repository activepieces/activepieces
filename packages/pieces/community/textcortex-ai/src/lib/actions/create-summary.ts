import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { textCortexApiCall } from '../common/client';
import { textCortexAuth } from '../common/auth';
import { 
  sourceLangProperty, 
  targetLangProperty, 
  modelProperty, 
  formalityProperty
} from '../common/props';

export const createSummary = createAction({
  auth: textCortexAuth,
  name: 'create_summary',
  displayName: 'Create Summary',
  description: 'Summarize input text to concise form.',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to summarize.',
      required: false,
    }),
    file_id: Property.ShortText({
      displayName: 'File ID',
      description: 'ID of the file to summarize.',
      required: false,
    }),
    model: modelProperty,
    max_tokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'The maximum number of tokens to generate.',
      required: false,
      defaultValue: 2048,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'The sampling temperature to be used in text generation. The higher the temperature, the higher the risk of the output to sound "made up".',
      required: false,
    }),
    n: Property.Number({
      displayName: 'Number of Outputs',
      description: 'The number of outputs to generate.',
      required: false,
      defaultValue: 1,
    }),
    formality: formalityProperty,
    source_lang: sourceLangProperty,
    target_lang: targetLangProperty,
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: 'The mode for summarization.',
      required: false,
      defaultValue: 'default',
      options: {
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Embeddings', value: 'embeddings' },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    const {
      text,
      file_id,
      model,
      max_tokens,
      temperature,
      n,
      formality,
      source_lang,
      target_lang,
      mode,
    } = propsValue;

    // Build request body, only including non-null/undefined values
    const body: Record<string, unknown> = {};
    
    if (text) body['text'] = text;
    if (file_id) body['file_id'] = file_id;
    if (model) body['model'] = model;
    if (max_tokens) body['max_tokens'] = max_tokens;
    if (temperature !== undefined && temperature !== null) body['temperature'] = temperature;
    if (n) body['n'] = n;
    if (formality) body['formality'] = formality;
    if (source_lang) body['source_lang'] = source_lang;
    if (target_lang) body['target_lang'] = target_lang;
    if (mode) body['mode'] = mode;

    return await textCortexApiCall({
      method: HttpMethod.POST,
      url: '/texts/summarizations',
      auth: auth,
      body,
    });
  },
});
