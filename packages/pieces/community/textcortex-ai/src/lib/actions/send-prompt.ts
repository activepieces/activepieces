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

export const sendPrompt = createAction({
  auth: textCortexAuth,
  name: 'send_prompt',
  displayName: 'Send Prompt',
  description: 'Send a custom prompt to TextCortex AI and generate a completion.',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to complete.',
      required: true,
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
  },
  async run({ propsValue, auth }) {
    const {
      text,
      model,
      max_tokens,
      temperature,
      n,
      formality,
      source_lang,
      target_lang,
    } = propsValue;

    // Build request body, only including non-null/undefined values
    const body: Record<string, unknown> = {
      text,
    };

    if (model) body['model'] = model;
    if (max_tokens) body['max_tokens'] = max_tokens;
    if (temperature !== undefined && temperature !== null) body['temperature'] = temperature;
    if (n) body['n'] = n;
    if (formality) body['formality'] = formality;
    if (source_lang) body['source_lang'] = source_lang;
    if (target_lang) body['target_lang'] = target_lang;

    return await textCortexApiCall({
      method: HttpMethod.POST,
      url: '/texts/completions',
      auth: auth,
      body,
    });
  },
});
