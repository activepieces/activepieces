import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../common';
import { jinaAiAuth } from '../../index';

export const webSearchSummarizationAction = createAction({
  auth:jinaAiAuth,
  name: 'web_search_summarization',
  displayName: 'Web Search Summarization',
  description:
    'Perform a web search and retrieve summarized results using the Reader API.',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The search query to perform.',
      required: true,
    }),
    read_full_content: Property.Checkbox({
      displayName: 'Read Full Content of SERP',
      description:
        'Visit every URL in the search result and return the full content using Reader. Toggle on to enable more Reader-specific options.',
      required: false,
      defaultValue: false,
    }),
    json_response: Property.Checkbox({
      displayName: 'JSON Response',
      description:
        'The response will be in JSON format, containing the URL, title, content, and timestamp (if available). In Search mode, it returns a list of five entries, each following the described JSON structure.',
      required: false,
      defaultValue: false,
    }),
    fetch_favicons: Property.Checkbox({
      displayName: 'Fetch Favicons',
      description:
        'This will fetch the favicon of each URL in the SERP and include them in the response as image URI, useful for UI rendering.',
      required: false,
      defaultValue: false,
    }),
    preferred_country: Property.StaticDropdown({
      displayName: 'Preferred Country',
      description:
        "The country to use for the search. It's a two-letter country code.",
      required: false,
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
    preferred_location: Property.ShortText({
      displayName: 'Preferred Location',
      description:
        "From where you want the search query to originate. It is recommended to specify location at the city level in order to simulate a real user's search.",
      required: false,
    }),
    preferred_language: Property.StaticDropdown({
      displayName: 'Preferred Language',
      description:
        "The language to use for the search. It's a two-letter language code.",
      required: false,
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
    pagination: Property.Number({
      displayName: 'Pagination',
      description:
        "The result offset. It skips the given number of results. It's used for pagination.",
      required: false,
      defaultValue: 1,
    }),
    in_site_search: Property.ShortText({
      displayName: 'In-site Search',
      description:
        'Returns the search results only from the specified website or domain. By default it searches the entire web.',
      required: false,
    }),
    bypass_cached_content: Property.Checkbox({
      displayName: 'Bypass Cached Content',
      description:
        'Our API caches URL contents for a certain amount of time. Set it to true to ignore the cached result and fetch the content from the URL directly.',
      required: false,
      defaultValue: false,
    }),
    eu_compliance: Property.Checkbox({
      displayName: 'EU Compliance',
      description:
        'All infrastructure and data processing operations reside entirely within EU jurisdiction.',
      required: false,
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
      auth: apiKey as string,
      headers,
    });

    return responseBody;
  },
});
