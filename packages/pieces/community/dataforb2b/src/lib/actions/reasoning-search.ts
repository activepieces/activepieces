import { createAction, Property } from '@activepieces/pieces-framework';
import { dataforb2bAuth, dataForB2BRequest } from '../common';

export const reasoningSearch = createAction({
  auth: dataforb2bAuth,
  name: 'reasoning_search',
  displayName: 'Reasoning Search',
  description:
    'Describe who you are looking for in plain language. An AI agent builds the best filters and runs the search. It may return status "needs_input" with questions — answer by calling again with the returned session_id and an answers object.',
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description:
        'Plain-language description, e.g. "Heads of Sales at French fintech scale-ups" (max 3000 chars). Required on the first call.',
      required: false,
    }),
    category: Property.StaticDropdown({
      displayName: 'Category',
      description: 'Whether to search people or companies',
      required: false,
      defaultValue: 'people',
      options: {
        options: [
          { label: 'People', value: 'people' },
          { label: 'Companies', value: 'companies' },
        ],
      },
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Number of results for the final search (1-100)',
      required: false,
      defaultValue: 25,
    }),
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description:
        'Session id returned by a previous call. Send it back to answer questions or refine the same search.',
      required: false,
    }),
    answers: Property.Json({
      displayName: 'Answers (JSON)',
      description:
        'Answers to a needs_input turn, e.g. {"company_size":"201-500"}. Requires Session ID.',
      required: false,
    }),
    enrichLive: Property.Checkbox({
      displayName: 'Enrich Live',
      description: 'Enrich results with fresh live data instead of cached data',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { query, category, maxResults, sessionId, answers, enrichLive } =
      context.propsValue;

    if (!query && !(sessionId && answers)) {
      throw new Error(
        "Provide 'query' (first call) or 'session_id' + 'answers' (to resolve a needs_input turn)."
      );
    }

    const body: Record<string, unknown> = {
      category: category ?? 'people',
      max_results: maxResults ?? 25,
      enrich_live: enrichLive ?? false,
    };
    if (query) body['query'] = query;
    if (sessionId) body['session_id'] = sessionId;
    if (answers) body['answers'] = answers;

    return dataForB2BRequest(context.auth.secret_text, '/search/reasoning', body);
  },
});
