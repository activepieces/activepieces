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
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Search query to find related articles and data.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Type of search to perform. Auto suits most searches; Instant and Fast trade depth for speed; Deep Lite, Deep and Deep Reasoning research more and cost more ($0.012 to $0.015 per search). Keyword and Neural are legacy options that Exa no longer documents.',
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
      description: 'Category of data to focus the search on. Company and People do not support published-date filters or Exclude Domains.',
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
      description: 'Number of results to return (max 100).',
      required: false,
      defaultValue: 10,
    }),
    includeDomains: Property.Array({
      displayName: 'Include Domains',
      description: 'Limit results to only these domains.',
      required: false,
    }),
    excludeDomains: Property.Array({
      displayName: 'Exclude Domains',
      description: 'Exclude results from these domains.',
      required: false,
    }),
    startCrawlDate: Property.DateTime({
      displayName: 'Start Crawl Date',
      description: 'Deprecated: Exa now ignores this filter. Use the published date filters instead.',
      required: false,
    }),
    endCrawlDate: Property.DateTime({
      displayName: 'End Crawl Date',
      description: 'Deprecated: Exa now ignores this filter. Use the published date filters instead.',
      required: false,
    }),
    startPublishedDate: Property.DateTime({
      displayName: 'Start Published Date',
      description: 'Only include results published after this ISO date.',
      required: false,
    }),
    endPublishedDate: Property.DateTime({
      displayName: 'End Published Date',
      description: 'Only include results published before this ISO date.',
      required: false,
    }),
    includeText: Property.Array({
      displayName: 'Include Text',
      description: 'Deprecated by Exa. Strings that must be present in the text of results.',
      required: false,
    }),
    excludeText: Property.Array({
      displayName: 'Exclude Text',
      description: 'Deprecated by Exa. Strings that must not be present in the text of results.',
      required: false,
    }),
    textMaxCharacters: Property.Number({
      displayName: 'Max Text Characters',
      description: 'Limit the page text returned per result to this many characters, e.g. 2000. Leave empty for full text.',
      required: false,
    }),
    highlights: Property.Checkbox({
      displayName: 'Include Highlights',
      description: 'Also return the most relevant snippets from each page.',
      required: false,
      defaultValue: false,
    }),
    maxAgeHours: Property.Number({
      displayName: 'Max Content Age (hours)',
      description: 'Use cached page content only if it is newer than this many hours (0 always fetches fresh, -1 always uses cache, up to 720). Leave empty for Exa\'s default.',
      required: false,
    }),
    userLocation: Property.ShortText({
      displayName: 'User Country',
      description: 'Two-letter country code to localize results, e.g. "US" or "DE".',
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
