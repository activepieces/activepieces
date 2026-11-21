import { createAction, Property } from '@activepieces/pieces-framework';
import { braveSearchAuth } from '../auth';
import { braveApi, braveNormalize } from '../common/client';
import { SAFESEARCH_VALUES, braveProps } from '../common/props';

const THRESHOLD_MODES = ['balanced', 'strict', 'lenient', 'disabled'];

export const getLlmContextAction = createAction({
  auth: braveSearchAuth,
  name: 'get_llm_context',
  classification: 'SEARCH',
  displayName: 'Get LLM Context',
  description: 'Get relevance-ranked page content for a query, ready to ground an AI answer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieves pre-extracted, relevance-ranked web content from Brave\'s LLM Context API for grounding answers (RAG), fact-checking or research. Unlike Search the Web, which returns links and short descriptions, this returns the substance of matching pages: one result per URL with url, title, hostname, age and snippets (text chunks, tables, code; some snippets are JSON-encoded strings, parse them when they start with { or [). Query up to 600 characters / 75 words. Tune with count (results considered, 1-50, default 20), maximum_number_of_urls (1-50, default 20), maximum_number_of_tokens (1024-32768, default 8192), maximum_number_of_tokens_per_url (512-8192, default 4096) and context_threshold_mode (balanced, strict, lenient, disabled). Cite the result url. Read-only; one billed Brave request per call.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      {
        key: 'results',
        label: 'Sources',
        labelKey: 'title',
        listItems: [
          { key: 'url', label: 'URL', format: 'url' },
          { key: 'title', label: 'Title' },
          { key: 'hostname', label: 'Hostname' },
          { key: 'age', label: 'Age', description: 'Discovery dates as Brave gives them (readable, ISO and relative). May be empty.' },
          { key: 'snippets', label: 'Snippets', description: 'Extracted content chunks. Some are JSON-encoded structured data.' },
        ],
      },
    ],
  },
  props: {
    query: braveProps.query({ maxChars: 600, maxWords: 75 }),
    count: braveProps.count({
      min: 1,
      max: 50,
      defaultValue: 20,
      description: 'How many search results Brave considers when picking content (1-50, default 20).',
    }),
    maximum_number_of_urls: Property.Number({
      displayName: 'Max URLs',
      description: 'Most different pages to include (1-50, default 20).',
      required: false,
      defaultValue: 20,
    }),
    maximum_number_of_tokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'Approximate total size of the content in tokens (1024-32768).',
      required: false,
      defaultValue: 8192,
    }),
    maximum_number_of_tokens_per_url: Property.Number({
      displayName: 'Max Tokens per URL',
      description: 'Approximate size limit per page in tokens (512-8192, default 4096).',
      required: false,
      defaultValue: 4096,
    }),
    context_threshold_mode: Property.StaticDropdown({
      displayName: 'Relevance Threshold',
      description: 'How strictly Brave filters content for relevance. Default: balanced.',
      required: false,
      defaultValue: 'balanced',
      options: {
        options: [
          { label: 'Balanced', value: 'balanced' },
          { label: 'Strict (only highly relevant content)', value: 'strict' },
          { label: 'Lenient (include more content)', value: 'lenient' },
          { label: 'Disabled (no filtering)', value: 'disabled' },
        ],
      },
    }),
    freshness: braveProps.freshness(),
    freshness_range: braveProps.freshnessRange(),
    country: braveProps.country(),
    search_lang: braveProps.searchLanguage(),
    safesearch: Property.StaticDropdown({
      displayName: 'Safe Search',
      description: 'Filter adult content. Leave empty for Brave\'s default.',
      required: false,
      options: {
        options: [
          { label: 'Off', value: 'off' },
          { label: 'Moderate', value: 'moderate' },
          { label: 'Strict', value: 'strict' },
        ],
      },
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const params = braveApi.buildQuery({
      q: braveApi.validateQuery({ query: p.query, maxChars: 600, maxWords: 75 }),
      count: braveApi.resolveInteger({ value: p.count, label: 'Number of Results', min: 1, max: 50, defaultValue: 20 }),
      maximum_number_of_urls: braveApi.resolveInteger({ value: p.maximum_number_of_urls, label: 'Max URLs', min: 1, max: 50, defaultValue: 20 }),
      maximum_number_of_tokens: braveApi.resolveInteger({ value: p.maximum_number_of_tokens, label: 'Max Tokens', min: 1024, max: 32768, defaultValue: 8192 }),
      maximum_number_of_tokens_per_url: braveApi.resolveInteger({
        value: p.maximum_number_of_tokens_per_url,
        label: 'Max Tokens per URL',
        min: 512,
        max: 8192,
        defaultValue: 4096,
      }),
      context_threshold_mode: braveApi.resolveChoice({ value: p.context_threshold_mode, allowed: THRESHOLD_MODES, label: 'Relevance Threshold', defaultValue: 'balanced' }),
      freshness: braveApi.resolveFreshness({ preset: p.freshness, customRange: p.freshness_range }),
      country: p.country,
      search_lang: p.search_lang,
      safesearch: braveApi.resolveChoice({ value: p.safesearch, allowed: SAFESEARCH_VALUES, label: 'Safe Search' }),
    });
    const body = await braveApi.get<unknown>({
      apiKey: context.auth.secret_text,
      path: '/llm/context',
      query: params,
      operation: 'LLM context',
    });
    return braveNormalize.llmContext(body);
  },
});
