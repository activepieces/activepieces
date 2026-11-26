import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../common';
import { jinaAiAuth } from '../auth';
import { webSearchSummarizationOutputSchema } from '../output-schemas';

export const webSearchSummarizationAction = createAction({
  auth:jinaAiAuth,
  name: 'web_search_summarization',
  outputSchema: webSearchSummarizationOutputSchema,
  classification: 'SEARCH',
  displayName: 'Web Search Summarization',
  description:
    'Perform a web search and retrieve summarized results using the Reader API.',
  audience: 'both',
  aiMetadata: {
    description:
      'Run a web search through the Jina Reader search API and return the result list, optionally visiting every hit to include full page content; supports country/language/location targeting, in-site (single-domain) search, and pagination. Pick this to discover pages by keyword — use Extract Webpage Content for a known URL or DeepSearch Query for multi-step research questions. Read-only search, so repeat calls are idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'text',
      props: ['query', 'in_site_search', 'pagination', 'read_full_content'],
    },
    {
      key: 'location',
      display: 'section',
      label: 'Location and Language',
      icon: 'location',
      props: ['preferred_country', 'preferred_language', 'preferred_location'],
    },
  ],
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'What to search the web for.',
      placeholder: 'best open-source CRM tools',
      required: true,
    }),
    in_site_search: Property.ShortText({
      displayName: 'Only This Site',
      description: 'Only return results from this website.',
      placeholder: 'example.com',
      required: false,
      width: 'half',
    }),
    pagination: Property.Number({
      displayName: 'Page',
      description: 'Page of results to return. 1 is the first page.',
      required: false,
      width: 'half',
      defaultValue: 1,
    }),
    read_full_content: Property.Checkbox({
      displayName: 'Read Full Content of Results',
      description:
        'Open every result and return its full page content. Slower.',
      required: false,
      defaultValue: false,
    }),
    preferred_country: Property.StaticDropdown({
      displayName: 'Country',
      description: 'Search as if from this country.',
      required: false,
      width: 'half',
      defaultValue: 'Default',
      options: {
        options: [
          { label: 'Default', value: 'Default' },
          { label: 'United States', value: 'US' },
          { label: 'Canada', value: 'CA' },
          { label: 'Mexico', value: 'MX' },
          { label: 'United Kingdom', value: 'GB' },
          { label: 'Germany', value: 'DE' },
          { label: 'France', value: 'FR' },
          { label: 'Japan', value: 'JP' },
          { label: 'China', value: 'CN' },
          { label: 'India', value: 'IN' },
          { label: 'Brazil', value: 'BR' },
          { label: 'Australia', value: 'AU' },
          { label: 'Italy', value: 'IT' },
          { label: 'Spain', value: 'ES' },
          { label: 'South Korea', value: 'KR' },
          { label: 'Netherlands', value: 'NL' },
          { label: 'Switzerland', value: 'CH' },
          { label: 'Sweden', value: 'SE' },
          { label: 'Ireland', value: 'IE' },
          { label: 'Singapore', value: 'SG' },
          { label: 'Israel', value: 'IL' },
          { label: 'Saudi Arabia', value: 'SA' },
          { label: 'South Africa', value: 'ZA' },
          { label: 'United Arab Emirates', value: 'AE' },
        ],
      },
    }),
    preferred_language: Property.StaticDropdown({
      displayName: 'Language',
      description: 'Language of the results.',
      required: false,
      width: 'half',
      defaultValue: 'Default',
      options: {
        options: [
          { label: 'Default', value: 'Default' },
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Japanese', value: 'ja' },
          { label: 'Chinese', value: 'zh-cn' },
          { label: 'Hindi', value: 'hi' },
          { label: 'Portuguese', value: 'pt' },
          { label: 'Italian', value: 'it' },
          { label: 'Korean', value: 'ko' },
          { label: 'Dutch', value: 'nl' },
          { label: 'Arabic', value: 'ar' },
          { label: 'Swedish', value: 'sv' },
          { label: 'Hebrew', value: 'iw' },
          { label: 'Afrikaans', value: 'af' },
        ],
      },
    }),
    preferred_location: Property.ShortText({
      displayName: 'City',
      description: 'Search as if from this city, for local results.',
      placeholder: 'San Francisco, California, United States',
      required: false,
    }),
    json_response: Property.Checkbox({
      displayName: 'JSON Response',
      description: 'Return the result as JSON instead of plain text.',
      required: false,
      advanced: true,
      defaultValue: false,
    }),
    fetch_favicons: Property.Checkbox({
      displayName: 'Fetch Favicons',
      description: "Include each result's favicon as an image URI.",
      required: false,
      advanced: true,
      defaultValue: false,
    }),
    bypass_cached_content: Property.Checkbox({
      displayName: 'Bypass Cache',
      description: "Ignore Jina's cache and fetch every page fresh.",
      required: false,
      advanced: true,
      defaultValue: false,
    }),
    eu_compliance: Property.Checkbox({
      displayName: 'EU Compliance',
      description: 'Process the request only on EU infrastructure.',
      required: false,
      advanced: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      query,
      read_full_content,
      json_response,
      fetch_favicons,
      preferred_country,
      preferred_location,
      preferred_language,
      pagination,
      in_site_search,
      bypass_cached_content,
      eu_compliance,
    } = context.propsValue;
    const { auth: apiKey } = context;

    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (pagination && pagination > 1) {
      queryParams.append('page', pagination.toString());
    }

    if (preferred_country && preferred_country !== 'Default') {
      queryParams.append('gl', preferred_country);
    }

    if (preferred_language && preferred_language !== 'Default') {
      queryParams.append('hl', preferred_language);
    }

    if (preferred_location) {
      queryParams.append('location', preferred_location);
    }

    const baseSearchUrl = eu_compliance
      ? JinaAICommon.euReaderSearchUrl
      : JinaAICommon.readerSearchUrl;
    const finalUrl = `${baseSearchUrl}/?${queryParams.toString()}`;

    const headers: Record<string, string> = {};

    if (json_response) {
      headers['Accept'] = 'application/json';
    }

    if (read_full_content) {
      headers['X-Engine'] = 'direct';
    } else {
      headers['X-Respond-With'] = 'no-content';
    }

    if (fetch_favicons) {
      headers['X-With-Favicons'] = 'true';
    }

    if (bypass_cached_content) {
      headers['X-No-Cache'] = 'true';
    }

    if (in_site_search) {
      headers['X-Site'] = in_site_search;
    }

    const responseBody = await JinaAICommon.makeRequest({
      url: finalUrl,
      method: HttpMethod.GET,
      auth: apiKey.secret_text,
      headers,
    });

    return responseBody;
  },
});
