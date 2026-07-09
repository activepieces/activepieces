import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const searchPeople = createAction({
  auth: villageAuth,
  name: 'search_people',
  displayName: 'Search People',
  description:
    'Search for people using natural language queries. Pass your search text in "prompt" (e.g. "engineers at Google"). Supports cursor-based pagination and structured filters.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only discovery search for people by a natural-language prompt and/or structured filters (at least one required); scope controls whether you search your network, everyone (global), or a caller-supplied candidate list. Use when you do not already have a specific profile URL — for a known person use Enrich Person instead. Cursor-paginated and safe to retry.',
    idempotent: true,
  },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Natural language search query (e.g. "Find CTOs at SaaS companies in San Francisco")',
      required: false,
    }),
    filters: Property.Json({
      displayName: 'Filters',
      description:
        'Structured search filters as JSON (alternative or complement to prompt). Either prompt or filters must be provided.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results per page (1-100, default 25)',
      required: false,
      defaultValue: 25,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description:
        'Search execution mode. "auto" classifies the query. Use "lookup" for direct matches, "simple" for firmographic queries, and "complex" for multi-step queries.',
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
      description:
        '"network" searches your connections first, "global" searches everyone, "specific_list" restricts to caller-provided identifiers (requires specific_list_data).',
      required: false,
      options: {
        options: [
          { label: 'Network', value: 'network' },
          { label: 'Global', value: 'global' },
          { label: 'Specific List', value: 'specific_list' },
        ],
      },
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Pagination cursor (encoded string from a previous response)',
      required: false,
    }),
    network_filters: Property.Json({
      displayName: 'Network Filters',
      description: 'Network filtering options as JSON',
      required: false,
    }),
    include_counts: Property.StaticDropdown({
      displayName: 'Include Counts',
      description:
        'Inline count scopes to compute on the first page only. Ignored when cursor is provided and adds latency.',
      required: false,
      options: {
        options: [
          { label: 'Global', value: 'global' },
          { label: 'Network', value: 'network' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
    specific_list_data: Property.Json({
      displayName: 'Specific List Data',
      description:
        'Required when scope="specific_list". Caller-supplied candidate set (1..50,000 entries). Each entry is a bare LinkedIn identifier or { id, score? }.',
      required: false,
    }),
  },
  async run(context) {
    const {
      prompt,
      filters,
      limit,
      mode,
      scope,
      cursor,
      network_filters,
      include_counts,
      specific_list_data,
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
    if (cursor !== undefined) body['cursor'] = cursor;
    if (network_filters !== undefined) body['network_filters'] = network_filters;
    if (include_counts !== undefined) body['include_counts'] = include_counts;
    if (specific_list_data !== undefined) body['specific_list_data'] = specific_list_data;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/people/search`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body,
    });
    return response.body;
  },
});
