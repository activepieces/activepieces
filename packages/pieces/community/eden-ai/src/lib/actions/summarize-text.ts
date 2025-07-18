import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import {
  getSummarizeProviders,
  getSummarizeModels,
  getSummarizeLanguages,
  normalizeSummarize,
} from '../common/providers';

export const summarizeTextAction = createAction({
  name: 'summarize_text',
  displayName: 'Summarize Text',
  description: 'Extract key sentences from long passages using Eden AI.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use.',
      required: true,
      refreshers: [],
      options: async () => ({
        options: await getSummarizeProviders(),
      }),
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to summarize.',
      required: true,
    }),
    language: Property.Dropdown({
      displayName: 'Language',
      description: 'Language code.',
      required: false,
      refreshers: ['provider'],
      options: async () => ({
        options: await getSummarizeLanguages(),
      }),
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      description: 'Model to use for summarization.',
      required: false,
      refreshers: ['provider'],
      options: async () => ({
        options: await getSummarizeModels(),
      }),
    }),
    num_sentences: Property.Number({
      displayName: 'Number of Sentences',
      description: 'Number of sentences to extract (optional)',
      required: false,
      defaultValue: 3,
    }),
    fallback_providers: Property.Array({
      displayName: 'Fallback Providers',
      description: 'List of fallback providers to use if the main provider fails.',
      required: false,
      defaultValue: [],
    }),
  },
  async run({ auth, propsValue }) {
    const { provider, text, language, model, num_sentences, fallback_providers } = propsValue;
    if (!provider || typeof provider !== 'string' || provider.trim().length === 0) {
      throw new Error('Provider is required and must be a non-empty string.');
    }
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text is required and must be a non-empty string.');
    }
    if (num_sentences !== undefined && (typeof num_sentences !== 'number' || num_sentences < 1 || num_sentences > 20)) {
      throw new Error('Number of sentences must be a number between 1 and 20.');
    }
    if (fallback_providers && !Array.isArray(fallback_providers)) {
      throw new Error('Fallback providers must be an array of provider names.');
    }
    const body: Record<string, any> = {
      providers: provider,
      text,
      fallback_providers: fallback_providers || [],
    };
    if (language) body['language'] = language;
    if (model) body['model'] = model;
    if (num_sentences) body['num_sentences'] = num_sentences;
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
      return normalizeSummarize(provider, response);
    } catch (err: any) {
      if (err.response && err.response.body && err.response.body.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      throw new Error(`Failed to summarize text: ${err.message || err}`);
    }
  },
}); 