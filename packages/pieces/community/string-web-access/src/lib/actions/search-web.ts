import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stringWebAccessAuth } from '../auth';
import { describeRequestError, makeRequest } from '../common';

export const searchWeb = createAction({
  auth: stringWebAccessAuth,
  name: 'search_web',
  displayName: 'Search Web',
  description: 'Search the web and return the organic results.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a web search through String Web Access and returns the organic results with position, title, URL, display URL and snippet. Use when you need to discover URLs for a question; follow it with Fetch URL to read a result. The engine can be Google, Bing, DuckDuckGo, Brave or Mojeek, and results can be localized by country and language. Read-only and safe to repeat.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'What to search for.',
      required: true,
    }),
    engine: Property.StaticDropdown<'google' | 'bing' | 'duckduckgo' | 'brave' | 'mojeek'>({
      displayName: 'Engine',
      description: 'Which search engine to query.',
      required: false,
      defaultValue: 'google',
      options: {
        disabled: false,
        options: [
          { label: 'Google', value: 'google' },
          { label: 'Bing', value: 'bing' },
          { label: 'DuckDuckGo', value: 'duckduckgo' },
          { label: 'Brave', value: 'brave' },
          { label: 'Mojeek', value: 'mojeek' },
        ],
      },
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'ISO 3166-1 alpha-2 country code used to localize results, for example `US` or `GB`.',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language tag for the results, for example `en` or `pt-br`.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const body: Record<string, unknown> = { query: propsValue.query };
    if (propsValue.engine) body['engine'] = propsValue.engine;
    if (propsValue.country) body['country'] = propsValue.country;
    if (propsValue.language) body['language'] = propsValue.language;

    try {
      return await makeRequest(auth.secret_text, HttpMethod.POST, '/search', body);
    } catch (error: any) {
      throw describeRequestError(error, 'The search could not be run.');
    }
  },
});
