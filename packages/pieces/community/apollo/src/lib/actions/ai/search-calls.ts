import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiSearchCallsAction = createAction({
  auth: apolloAuth,
  name: 'ai_search_calls',
  classification: 'SEARCH',
  displayName: 'Search Calls',
  description: 'Search calls made or received with the Apollo dialer.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches calls your team made or received with the Apollo dialer by keywords, direction, user IDs and date range, returning numbers, times, duration, outcome and notes. Uses no credits; needs a master API key.',
    idempotent: true,
  },
  props: {
    keywords: aiProps.text({ displayName: 'Keywords', description: 'Words to match.', required: false }),
    direction: aiProps.choice({
      displayName: 'Direction',
      description: 'incoming or outgoing (default: both).',
      required: false,
      options: [
        { label: 'Incoming', value: 'incoming' },
        { label: 'Outgoing', value: 'outgoing' },
      ],
    }),
    user_ids: aiProps.textList({ displayName: 'User IDs', description: 'Only calls by these users (List Users, field id).', required: false }),
    date_from: aiProps.text({ displayName: 'From Date', description: 'Start date, YYYY-MM-DD.', required: false }),
    date_to: aiProps.text({ displayName: 'To Date', description: 'End date, YYYY-MM-DD.', required: false }),
    page: aiProps.page(),
    per_page: aiProps.perPage({ max: 100, fallback: 25 }),
  },
  outputSchema: apolloOutputSchemas.callSearch,
  async run({ propsValue, auth }) {
    const { page, perPage } = apolloInputs.pageParams({ page: propsValue.page, perPage: propsValue.per_page, maxPerPage: 100, defaultPerPage: 25 });
    const body = await apolloRequests.searchCalls({
      apiKey: apiKeyOf(auth),
      query: {
        q_keywords: apolloInputs.optionalText(propsValue.keywords),
        inbound: apolloInputs.optionalText(propsValue.direction),
        'user_ids[]': apolloInputs.stringList(propsValue.user_ids),
        'date_range[min]': apolloInputs.ymdDate({ value: propsValue.date_from, label: 'From Date' }),
        'date_range[max]': apolloInputs.ymdDate({ value: propsValue.date_to, label: 'To Date' }),
        page,
        per_page: perPage,
      },
    });
    const calls = recordsOf(body['phone_calls']).map((call) => apolloMappers.call(call));
    return { ...apolloMappers.pageInfo({ body, page, perPage, returned: calls.length }), calls };
  },
});
