import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { textcortexAuth } from '../common/auth';
import { textcortexCommon } from '../common/client';
import { API_ENDPOINTS, AI_MODELS, FORMALITY_LEVELS, LANGUAGES } from '../common/common';

export const sendPrompt = createAction({
  auth: textcortexAuth,
  name: 'send_prompt',
  displayName: 'Send Prompt',
  description: 'Send a custom prompt to TextCortex AI and generate a completion.',
  props: {
    text: Property.LongText({
      displayName: 'Text to Complete',
      description: 'Enter the beginning of your text and AI will complete it (e.g., "The benefits of renewable energy are")',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The language model to use',
      required: false,
      defaultValue: 'gemini-2-0-flash',
      options: {
        options: AI_MODELS,
      },
    }),
    formality: Property.StaticDropdown({
      displayName: 'Formality',
      description: 'The formality of the generated text',
      required: false,
      defaultValue: 'default',
      options: {
        options: FORMALITY_LEVELS,
      },
    }),
    source_lang: Property.StaticDropdown({
      displayName: 'Source Language',
      description: 'The language of the source text',
      required: false,
      defaultValue: 'en',
      options: {
        options: [
          { label: 'English (Default)', value: 'en' },
          { label: 'Auto-detect', value: 'auto' },
          ...LANGUAGES.filter(lang => lang.value !== 'en'),
        ],
      },
    }),
    target_lang: Property.StaticDropdown({
      displayName: 'Target Language',
      description: 'The language for the generated text',
      required: false,
      defaultValue: 'en',
      options: {
        options: [
          { label: 'English (American)', value: 'en' },
          { label: 'English (British)', value: 'en-gb' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Portuguese (Brazilian)', value: 'pt-br' },
          { label: 'Portuguese', value: 'pt' },
          ...LANGUAGES.filter(lang => !['en', 'pt', 'es', 'fr', 'de'].includes(lang.value)),
        ],
      },
    }),
    max_tokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'Maximum length of generated text (1-4096 tokens)',
      required: false,
      defaultValue: 2048,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Controls creativity (0.0-2.0). Higher values = more creative, lower = more focused.',
      required: false,
    }),
    n: Property.Number({
      displayName: 'Number of Outputs',
      description: 'How many completions to generate (1-5)',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    try {
      const requestBody: any = {
        text: context.propsValue.text,
      };

      if (context.propsValue.model && context.propsValue.model !== 'gemini-2-0-flash') {
        requestBody.model = context.propsValue.model;
      }

      if (context.propsValue.formality && context.propsValue.formality !== 'default') {
        requestBody.formality = context.propsValue.formality;
      }

      if (context.propsValue.source_lang && context.propsValue.source_lang !== 'en') {
        requestBody.source_lang = context.propsValue.source_lang;
      }

      if (context.propsValue.target_lang && context.propsValue.target_lang !== 'en') {
        requestBody.target_lang = context.propsValue.target_lang;
      }

      if (context.propsValue.max_tokens && context.propsValue.max_tokens !== 2048) {
        requestBody.max_tokens = context.propsValue.max_tokens;
      }

      if (context.propsValue.temperature !== undefined) {
        requestBody.temperature = context.propsValue.temperature;
      }

      if (context.propsValue.n && context.propsValue.n !== 1) {
        requestBody.n = context.propsValue.n;
      }

      const response = await textcortexCommon.apiCall({
        auth: context.auth,
        method: HttpMethod.POST,
        resourceUri: API_ENDPOINTS.COMPLETIONS,
        body: requestBody,
      });

      const outputs = response.body.data?.outputs || [];
      const generatedText = outputs.length > 0 ? outputs[0].text : response.body.text || response.body;

      return {
        success: true,
        text: generatedText,
        outputs: outputs,
        remaining_credits: response.body.data?.remaining_credits,
        metadata: {
          prompt: context.propsValue.text,
          model: context.propsValue.model || 'gemini-2-0-flash',
          formality: context.propsValue.formality || 'default',
          parameters: {
            max_tokens: context.propsValue.max_tokens || 2048,
            temperature: context.propsValue.temperature,
            n: context.propsValue.n || 1,
            source_lang: context.propsValue.source_lang || 'en',
            target_lang: context.propsValue.target_lang || 'en',
          },
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your TextCortex API key.');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait and try again or upgrade your TextCortex plan.');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid request. Please check your input parameters.');
      }
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      throw new Error(`Text generation failed: ${error.message || 'Unknown error'}`);
    }
  },
});