import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { parallelAuth } from '../auth';
import { parallelClient } from '../common/client';

export const searchAction = createAction({
  auth: parallelAuth,
  name: 'search',
  displayName: 'Search the Web',
  description:
    'Search the web with natural-language objectives. Returns LLM-optimized excerpts with citations.',
  props: {
    objective: Property.LongText({
      displayName: 'Objective',
      description:
        'Natural-language description of the underlying question or goal driving the search. Should be self-contained with enough context to understand the intent.',
      required: false,
    }),
    search_queries: Property.Array({
      displayName: 'Search Queries',
      description:
        'Concise keyword search queries (3-6 words each). At least one query is required; 2-3 is best.',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description:
        'Basic: low latency with 2-3 high-quality queries. Advanced: higher quality with deeper retrieval.',
      required: false,
      defaultValue: 'advanced',
      options: {
        options: [
          { label: 'Basic', value: 'basic' },
          { label: 'Advanced', value: 'advanced' },
        ],
      },
    }),
    max_chars_total: Property.Number({
      displayName: 'Max Total Characters',
      description: 'Upper bound on total characters across excerpts from all results.',
      required: false,
    }),
    include_domains: Property.Array({
      displayName: 'Include Domains',
      description: 'Optional list of domains to restrict results to (e.g. wikipedia.org, .gov).',
      required: false,
    }),
    exclude_domains: Property.Array({
      displayName: 'Exclude Domains',
      description: 'Optional list of domains to exclude from results.',
      required: false,
    }),
    session_id: Property.ShortText({
      displayName: 'Session ID',
      description: 'Optional session identifier to share context across search/extract calls.',
      required: false,
    }),
  },
  async run(context) {
    const queries = (context.propsValue.search_queries ?? []).filter(
      (q): q is string => typeof q === 'string' && q.trim().length > 0,
    );
    if (queries.length === 0) {
      throw new Error('At least one search query is required.');
    }

    const includeDomains = ((context.propsValue.include_domains ?? []) as unknown[]).filter(
      (d): d is string => typeof d === 'string' && d.trim().length > 0,
    );
    const excludeDomains = ((context.propsValue.exclude_domains ?? []) as unknown[]).filter(
      (d): d is string => typeof d === 'string' && d.trim().length > 0,
    );

    const sourcePolicy =
      includeDomains.length || excludeDomains.length
        ? {
            ...(includeDomains.length ? { include_domains: includeDomains } : {}),
            ...(excludeDomains.length ? { exclude_domains: excludeDomains } : {}),
          }
        : undefined;

    const body: Record<string, unknown> = {
      search_queries: queries,
    };
    if (context.propsValue.objective) body['objective'] = context.propsValue.objective;
    if (context.propsValue.mode) body['mode'] = context.propsValue.mode;
    if (context.propsValue.max_chars_total !== undefined && context.propsValue.max_chars_total !== null) {
      body['max_chars_total'] = context.propsValue.max_chars_total;
    }
    if (context.propsValue.session_id) body['session_id'] = context.propsValue.session_id;
    if (sourcePolicy) body['source_policy'] = sourcePolicy;

    return await parallelClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/search',
      body,
    });
  },
});
