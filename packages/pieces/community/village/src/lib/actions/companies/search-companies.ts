import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const searchCompanies = createAction({
  auth: villageAuth,
  name: 'search_companies',
  displayName: 'Search Companies',
  description:
    'Search for companies using natural language (in the "prompt" field) and/or structured filters. Returns matching companies with relevance and connection-strength scores; supports cursor-based pagination.',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'Natural language search query, e.g. "Find B2B SaaS companies with 50-200 employees in California". Either prompt or filters must be provided.',
      required: false,
    }),
    filters: Property.Json({
      displayName: 'Filters',
      description:
        'Structured filters. Supported keys: name, domain, linkedinUrl, linkedinId, industry, companySize, companyType, country, city, foundedAfter, foundedBefore, keywords.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results per page (default 25, max 100)',
      required: false,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description:
        'Search mode: auto (let system decide), lookup (direct match), simple (LLM-powered), or complex (thinking + high-reasoning SQL generation).',
      required: false,
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Lookup', value: 'lookup' },
          { label: 'Simple', value: 'simple' },
          { label: 'Complex', value: 'complex' },
        ],
      },
    }),
    scope: Property.StaticDropdown({
      displayName: 'Scope',
      description: 'Search scope: network (connections first) or global (all companies).',
      required: false,
      options: {
        options: [
          { label: 'Network', value: 'network' },
          { label: 'Global', value: 'global' },
        ],
      },
    }),
    stream: Property.Checkbox({
      displayName: 'Stream',
      description: 'Enable SSE streaming for progressive results.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Pagination cursor (encoded string) from a previous response.',
      required: false,
    }),
    network_filters: Property.Json({
      displayName: 'Network Filters',
      description: 'Network path and relationship filters.',
      required: false,
    }),
    include_counts: Property.StaticDropdown({
      displayName: 'Include Counts',
      description:
        'Inline count scope to compute on the first page only. Ignored when cursor is provided and adds latency.',
      required: false,
      options: {
        options: [
          { label: 'Global', value: 'global' },
          { label: 'Network', value: 'network' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      prompt,
      filters,
      limit,
      mode,
      scope,
      stream,
      cursor,
      network_filters,
      include_counts,
    } = context.propsValue;

    if (!prompt && !filters) {
      throw new Error('Either prompt or filters must be provided.');
    }

    const body: Record<string, unknown> = {};
    if (prompt !== undefined) body['prompt'] = prompt;
    if (filters !== undefined) body['filters'] = filters;
    if (limit !== undefined) body['limit'] = limit;
    if (mode !== undefined) body['mode'] = mode;
    if (scope !== undefined) body['scope'] = scope;
    if (stream !== undefined) body['stream'] = stream;
    if (cursor !== undefined) body['cursor'] = cursor;
    if (network_filters !== undefined) body['network_filters'] = network_filters;
    if (include_counts !== undefined) body['include_counts'] = include_counts;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/companies/search`,
      headers: { Authorization: `Bearer ${context.auth}` },
      body,
    });
    return response.body;
  },
});
