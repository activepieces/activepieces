import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { exaAuth } from '../../auth';
import { exaApi, exaInput } from '../../common/client';
import { ExaCost, ExaResult, exaResults } from '../../common/results';
import { exaSearchOutputSchema } from '../../output-schemas-ai';

export const exaSearchAction = createAction({
  name: 'exa_search',
  classification: 'SEARCH',
  displayName: 'Search the Web',
  description: 'Searches the web with Exa and returns flat result rows.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches the live web with Exa and returns ranked pages with title, URL, date and optionally page text, highlights or a query-guided summary. Use to discover pages for a topic; use exa_get_contents when the URLs are already known and exa_answer for a direct cited answer. Type sets depth and price (instant $0.004, auto/fast $0.007, deep modes $0.012 to $0.015); the company and people categories reject published-date filters and excludeDomains. Read-only and idempotent.',
    idempotent: true,
  },
  auth: exaAuth,
  outputSchema: exaSearchOutputSchema,
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'What to search for, in natural language, e.g. "latest research on solid-state batteries".',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Search Type',
      description: "One of 'auto' (default), 'fast', 'instant', 'deep-lite', 'deep', 'deep-reasoning'. Deep modes are slower and cost more.",
      required: false,
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Fast', value: 'fast' },
          { label: 'Instant', value: 'instant' },
          { label: 'Deep Lite', value: 'deep-lite' },
          { label: 'Deep', value: 'deep' },
          { label: 'Deep Reasoning', value: 'deep-reasoning' },
        ],
      },
    }),
    category: Property.StaticDropdown({
      displayName: 'Category',
      description: "Optional focus: 'company', 'people', 'news', 'publication', 'personal site' or 'financial report'.",
      required: false,
      options: {
        options: [
          { label: 'Company', value: 'company' },
          { label: 'People', value: 'people' },
          { label: 'News', value: 'news' },
          { label: 'Publication', value: 'publication' },
          { label: 'Personal Site', value: 'personal site' },
          { label: 'Financial Report', value: 'financial report' },
        ],
      },
    }),
    numResults: Property.Number({
      displayName: 'Number of Results',
      description: 'How many results to return, 1 to 100. Defaults to 10; each result above 10 costs $0.001.',
      required: false,
      defaultValue: 10,
    }),
    includeDomains: Property.Array({
      displayName: 'Include Domains',
      description: 'Only return results from these domains or paths, e.g. "arxiv.org" or "example.com/blog".',
      required: false,
    }),
    excludeDomains: Property.Array({
      displayName: 'Exclude Domains',
      description: 'Never return results from these domains. Not allowed with the company or people category.',
      required: false,
    }),
    startPublishedDate: Property.DateTime({
      displayName: 'Published After',
      description: 'Only results published after this ISO 8601 date, e.g. "2026-01-01T00:00:00Z". Not allowed with the company or people category.',
      required: false,
    }),
    endPublishedDate: Property.DateTime({
      displayName: 'Published Before',
      description: 'Only results published before this ISO 8601 date. Not allowed with the company or people category.',
      required: false,
    }),
    includeText: Property.Checkbox({
      displayName: 'Include Page Text',
      description: 'Return the page text for each result.',
      required: false,
      defaultValue: true,
    }),
    textMaxCharacters: Property.Number({
      displayName: 'Max Text Characters',
      description: 'Cap the page text per result, e.g. 2000. Only used when page text is included.',
      required: false,
    }),
    includeHighlights: Property.Checkbox({
      displayName: 'Include Highlights',
      description: 'Return the most relevant snippets from each page.',
      required: false,
      defaultValue: false,
    }),
    highlightsQuery: Property.ShortText({
      displayName: 'Highlights Focus',
      description: 'Optional question that steers which snippets are picked. Turns highlights on.',
      required: false,
    }),
    summaryQuery: Property.ShortText({
      displayName: 'Summary Question',
      description: 'Return a per-page AI summary focused on this question, e.g. "What does this company sell?" ($0.001 per page).',
      required: false,
    }),
    maxAgeHours: Property.Number({
      displayName: 'Max Content Age (hours)',
      description: 'Use cached content only if newer than this many hours; 0 always fetches fresh, -1 always uses cache, max 720.',
      required: false,
    }),
    userLocation: Property.ShortText({
      displayName: 'User Country',
      description: 'Two-letter ISO country code to localize results, e.g. "US".',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const numResults = exaInput.optionalInteger({ value: props.numResults, name: 'Number of Results', min: 1, max: 100 });
    const textMaxCharacters = exaInput.optionalInteger({ value: props.textMaxCharacters, name: 'Max Text Characters', min: 1, max: 1000000 });
    const maxAgeHours = exaInput.optionalInteger({ value: props.maxAgeHours, name: 'Max Content Age (hours)', min: -1, max: 720 });
    const includeDomains = exaInput.stringList(props.includeDomains);
    const excludeDomains = exaInput.stringList(props.excludeDomains);
    const type = exaInput.optionalText(props.type) ?? 'auto';
    if (!SEARCH_TYPES.includes(type)) {
      throw new Error(`Search Type must be one of: ${SEARCH_TYPES.join(', ')}.`);
    }
    const category = exaInput.optionalText(props.category);
    const highlightsQuery = exaInput.optionalText(props.highlightsQuery);
    const summaryQuery = exaInput.optionalText(props.summaryQuery);
    const userLocation = exaInput.optionalCountry({ value: props.userLocation, name: 'User Country' });
    const startPublishedDate = exaInput.optionalText(props.startPublishedDate);
    const endPublishedDate = exaInput.optionalText(props.endPublishedDate);

    if (category === 'company' || category === 'people') {
      if (startPublishedDate || endPublishedDate || excludeDomains) {
        throw new Error(`The ${category} category does not support published-date filters or Exclude Domains.`);
      }
    }

    const includeText = props.includeText !== false;
    const contents = {
      ...(includeText
        ? { text: textMaxCharacters !== undefined ? { maxCharacters: textMaxCharacters } : true }
        : {}),
      ...(highlightsQuery
        ? { highlights: { query: highlightsQuery } }
        : props.includeHighlights
          ? { highlights: true }
          : {}),
      ...(summaryQuery ? { summary: { query: summaryQuery } } : {}),
      ...(maxAgeHours !== undefined ? { maxAgeHours } : {}),
    };

    const response = await exaApi.call<{ results?: ExaResult[]; costDollars?: ExaCost }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/search',
      body: {
        query: props.query,
        type,
        ...(category ? { category } : {}),
        ...(numResults !== undefined ? { numResults } : {}),
        ...(includeDomains ? { includeDomains } : {}),
        ...(excludeDomains ? { excludeDomains } : {}),
        ...(startPublishedDate ? { startPublishedDate } : {}),
        ...(endPublishedDate ? { endPublishedDate } : {}),
        ...(userLocation ? { userLocation } : {}),
        ...(Object.keys(contents).length > 0 ? { contents } : {}),
      },
    });
    const results = (response.results ?? []).map(exaResults.flattenResult);
    return {
      results,
      count: results.length,
      cost_total: response.costDollars?.total ?? null,
    };
  },
});

const SEARCH_TYPES: readonly string[] = ['auto', 'fast', 'instant', 'deep-lite', 'deep', 'deep-reasoning'];
