import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { exaAuth } from '../auth';
import { exaInput } from '../common/client';
import { searchResultsOutputSchema } from '../output-schemas';

export const performSearchAction = createAction({
  name: 'perform_search',
  classification: 'SEARCH',
  displayName: 'Perform Search',
  description: "Search the web using semantic or keyword-based search.",
  audience: 'human',
  aiMetadata: {
    description: 'Runs a web search through Exa and returns matching results with page text. Use when an agent needs to discover relevant URLs/content for a query; the search type ranges from instant and fast to auto and the deep research modes, and results can be narrowed by category, domain include/exclude lists, publish date range, and country, optionally adding highlights. Requires a query string. Read-only and idempotent.',
    idempotent: true,
  },
  auth: exaAuth,
  outputSchema: searchResultsOutputSchema,
  propertyGroups: [
    { key: 'search', display: 'section', label: 'Search', icon: 'text', props: ['query', 'type', 'category', 'numResults'] },
    { key: 'filters', display: 'section', label: 'Filters', icon: 'filter', props: ['includeDomains', 'excludeDomains', 'startPublishedDate', 'endPublishedDate', 'userLocation', 'moderation', 'includeText', 'excludeText'] },
    { key: 'content', display: 'section', label: 'Page Content', icon: 'file', props: ['textMaxCharacters', 'maxAgeHours', 'highlights'] },
  ],
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'What to search for, in plain words.',
      placeholder: 'AI startups building developer tools',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Auto suits most searches. Deep options research more and cost more.',
      width: 'half',
      required: false,
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Keyword (legacy)', value: 'keyword' },
          { label: 'Neural (legacy)', value: 'neural' },
          { label: 'Instant', value: 'instant' },
          { label: 'Fast', value: 'fast' },
          { label: 'Deep Lite', value: 'deep-lite' },
          { label: 'Deep', value: 'deep' },
          { label: 'Deep Reasoning', value: 'deep-reasoning' },
        ],
      },
    }),
    category: Property.StaticDropdown({
      displayName: 'Category',
      description: 'Company and People do not support date filters or Exclude Domains.',
      width: 'half',
      required: false,
      options: {
        options: [
          { label: 'Company', value: 'company' },
          { label: 'Research Paper', value: 'research paper' },
          { label: 'News', value: 'news' },
          { label: 'PDF', value: 'pdf' },
          { label: 'GitHub', value: 'github' },
          { label: 'Tweet', value: 'tweet' },
          { label: 'Personal Site', value: 'personal site' },
          { label: 'LinkedIn Profile', value: 'linkedin profile' },
          { label: 'Financial Report', value: 'financial report' },
          { label: 'Publication', value: 'publication' },
          { label: 'People', value: 'people' },
        ],
      },
    }),
    numResults: Property.Number({
      displayName: 'Number of Results',
      description: 'How many results to return, up to 100.',
      required: false,
      defaultValue: 10,
    }),
    includeDomains: Property.Array({
      displayName: 'Include Domains',
      description: 'Only return results from these domains.',
      width: 'half',
      required: false,
    }),
    excludeDomains: Property.Array({
      displayName: 'Exclude Domains',
      description: 'Never return results from these domains.',
      width: 'half',
      required: false,
    }),
    startCrawlDate: Property.DateTime({
      displayName: 'Start Crawl Date',
      description: 'Exa now ignores this filter. Use the published dates instead.',
      advanced: true,
      required: false,
    }),
    endCrawlDate: Property.DateTime({
      displayName: 'End Crawl Date',
      description: 'Exa now ignores this filter. Use the published dates instead.',
      advanced: true,
      required: false,
    }),
    startPublishedDate: Property.DateTime({
      displayName: 'Start Published Date',
      description: 'Only results published after this date.',
      width: 'half',
      required: false,
    }),
    endPublishedDate: Property.DateTime({
      displayName: 'End Published Date',
      description: 'Only results published before this date.',
      width: 'half',
      required: false,
    }),
    includeText: Property.Array({
      displayName: 'Include Text',
      description: 'Deprecated by Exa. Results must contain this phrase.',
      width: 'half',
      required: false,
    }),
    excludeText: Property.Array({
      displayName: 'Exclude Text',
      description: 'Deprecated by Exa. Results must not contain this phrase.',
      width: 'half',
      required: false,
    }),
    textMaxCharacters: Property.Number({
      displayName: 'Max Text Characters',
      description: "Cut each page's text to this many characters. Empty: full text.",
      width: 'half',
      required: false,
    }),
    highlights: Property.Checkbox({
      displayName: 'Include Highlights',
      description: 'Also return the most relevant snippets from each page.',
      required: false,
      defaultValue: false,
    }),
    maxAgeHours: Property.Number({
      displayName: 'Max Content Age',
      description: 'Max cache age in hours, up to 720. 0: always fresh, -1: always cached.',
      width: 'half',
      required: false,
    }),
    userLocation: Property.ShortText({
      displayName: 'User Country',
      description: 'Two-letter country code to localize results.',
      placeholder: 'US',
      required: false,
    }),
    moderation: Property.Checkbox({
      displayName: 'Filter Unsafe Content',
      description: 'Remove unsafe content from the results.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;

    const textMaxCharacters = exaInput.optionalInteger({
      value: context.propsValue.textMaxCharacters,
      name: 'Max Text Characters',
      min: 1,
      max: 1000000,
    });
    const maxAgeHours = exaInput.optionalInteger({
      value: context.propsValue.maxAgeHours,
      name: 'Max Content Age (hours)',
      min: -1,
      max: 720,
    });
    const userLocation = exaInput.optionalCountry({ value: context.propsValue.userLocation, name: 'User Country' });

    const body: Record<string, unknown> = {
      query: context.propsValue.query,
      contents: {
        text: textMaxCharacters !== undefined ? { maxCharacters: textMaxCharacters } : true,
        ...(context.propsValue.highlights ? { highlights: true } : {}),
        ...(maxAgeHours !== undefined ? { maxAgeHours } : {}),
      },
      ...(userLocation ? { userLocation } : {}),
      ...(context.propsValue.moderation ? { moderation: true } : {}),
    };

    const optionalProps = [
      'type', 'category', 'numResults', 'includeDomains', 'excludeDomains',
      'startCrawlDate', 'endCrawlDate', 'startPublishedDate', 'endPublishedDate',
      'includeText', 'excludeText',
    ];

    for (const prop of optionalProps) {
      const val = context.propsValue[prop as keyof typeof context.propsValue];
      if (val !== undefined && val !== null && val !== '') {
        body[prop] = val;
      }
    }

    const response =  await makeRequest(apiKey, HttpMethod.POST, '/search', body) as {results:Record<string,any>[]};
    return response.results;
  },
});
