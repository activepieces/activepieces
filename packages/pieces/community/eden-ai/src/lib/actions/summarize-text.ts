import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import { z } from 'zod';

const SUMMARIZE_PROVIDERS = [
  { label: 'OpenAI GPT-4', value: 'openai' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'Cohere', value: 'cohere' },
  { label: 'XAI Grok', value: 'xai' },
  { label: 'Anthropic Claude', value: 'anthropic' },
  { label: 'Aleph Alpha', value: 'alephalpha' },
  { label: 'Writesonic', value: 'writesonic' },
  { label: 'MeaningCloud', value: 'meaningcloud' },
  { label: 'Emvista', value: 'emvista' },
  { label: 'OneAI', value: 'oneai' },
];

const SUMMARIZE_LANGUAGES = [
  { label: 'Auto Detection', value: 'auto-detect' },
  { label: 'Bulgarian', value: 'bg' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Chinese (Simplified)', value: 'zh-Hans' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'Dutch', value: 'nl' },
  { label: 'English', value: 'en' },
  { label: 'Estonian', value: 'et' },
  { label: 'Finnish', value: 'fi' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Modern Greek', value: 'el' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Latvian', value: 'lv' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Portuguese (Brazil)', value: 'pt-BR' },
  { label: 'Portuguese (Portugal)', value: 'pt-PT' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Russian', value: 'ru' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Spanish', value: 'es' },
  { label: 'Swedish', value: 'sv' },
];

function normalizeSummarizeResponse(provider: string, response: any) {
  const providerResult = response[provider];
  if (!providerResult) {
    return { provider, summary: '', status: 'fail', raw: response };
  }

  return {
    provider,
    summary: providerResult.result || '',
    status: providerResult.status || 'success',
    original_response: providerResult.original_response || null,
    raw: response,
  };
}

export const summarizeTextAction = createAction({
  name: 'summarize_text',
  displayName: 'Summarize Text',
  description: 'Extract key sentences and create summaries from long text passages using various AI providers.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use for text summarization.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(SUMMARIZE_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Text to Summarize',
      description: 'The text content you want to summarize. Can be articles, documents, or any long-form text.',
      required: true,
    }),
    output_sentences: Property.Number({
      displayName: 'Number of Summary Sentences',
      description: 'How many sentences should the summary contain (1-20).',
      required: false,
      defaultValue: 3,
    }),
    language: Property.Dropdown({
      displayName: 'Text Language',
      description: 'The language of the input text. Choose "Auto Detection" if unsure.',
      required: false,
      refreshers: [],
      options: createStaticDropdown(SUMMARIZE_LANGUAGES),
      defaultValue: 'auto-detect',
    }),
    model: Property.ShortText({
      displayName: 'Specific Model',
      description: 'Specific model to use (e.g., gpt-4, gpt-4o, summarize-xlarge). Leave empty for default.',
      required: false,
    }),
    fallback_providers: Property.MultiSelectDropdown({
      displayName: 'Fallback Providers',
      description: 'Alternative providers to try if the main provider fails (up to 5).',
      required: false,
      refreshers: [],
      options: createStaticDropdown(SUMMARIZE_PROVIDERS),
    }),
    show_original_response: Property.Checkbox({
      displayName: 'Include Original Response',
      description: 'Include the raw provider response in the output for debugging.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      provider: z.string().min(1, 'Provider is required'),
      text: z.string().min(1, 'Text to summarize is required'),
      output_sentences: z.number().min(1).max(20).nullish(),
      language: z.string().nullish(),
      model: z.string().nullish(),
      fallback_providers: z.array(z.string()).max(5).nullish(),
      show_original_response: z.boolean().nullish(),
    });

    const { 
      provider, 
      text, 
      output_sentences, 
      language, 
      model, 
      fallback_providers,
      show_original_response 
    } = propsValue;

    const body: Record<string, any> = {
      providers: provider,
      text,
    };

    if (output_sentences !== undefined) body['output_sentences'] = output_sentences;
    if (language && language !== 'auto-detect') body['language'] = language;
    if (show_original_response) body['show_original_response'] = true;
    
    if (fallback_providers && fallback_providers.length > 0) {
      body['fallback_providers'] = fallback_providers.slice(0, 5);
    }

    if (model) {
      body['settings'] = { [provider]: model };
    }

    try {
      const response = await edenAiApiCall({
        apiKey: auth as string,
        method: HttpMethod.POST,
        resourceUri: '/text/summarize',
        body,
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }

      return normalizeSummarizeResponse(provider, response);
    } catch (err: any) {
      if (err.response?.body?.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      if (err.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (err.response?.status === 401) {
        throw new Error('Invalid API key. Please check your Eden AI credentials.');
      }
      if (err.response?.status === 400) {
        throw new Error('Invalid request. Please check your input text and parameters.');
      }
      // Fallback for object errors - properly stringify
      if (err.message && typeof err.message === 'string') {
        throw new Error(`Failed to summarize text: ${err.message}`);
      }
      throw new Error(`Failed to summarize text: ${JSON.stringify(err)}`);
    }
  },
}); 