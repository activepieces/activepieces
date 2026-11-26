import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiListDealsAction = createAction({
  auth: apolloAuth,
  name: 'ai_list_deals',
  classification: 'SEARCH',
  displayName: 'List Deals',
  description: 'List the deals in your Apollo workspace.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists your Apollo deals (opportunities) page by page with amount, stage, close date, owner and account, optionally sorted by amount, closed or won. Apollo has no text search for deals, so page through and filter. Uses no credits; needs a paid Apollo plan.',
    idempotent: true,
  },
  props: {
    sort_by: aiProps.choice({
      displayName: 'Sort By',
      description: 'amount (largest first), is_closed (closed first) or is_won (won first).',
      required: false,
      options: [
        { label: 'Amount', value: 'amount' },
        { label: 'Closed first', value: 'is_closed' },
        { label: 'Won first', value: 'is_won' },
      ],
    }),
    page: aiProps.page(),
    per_page: aiProps.perPage({ max: 100, fallback: 25 }),
  },
  outputSchema: apolloOutputSchemas.dealSearch,
  async run({ propsValue, auth }) {
    const { page, perPage } = apolloInputs.pageParams({ page: propsValue.page, perPage: propsValue.per_page, maxPerPage: 100, defaultPerPage: 25 });
    const body = await apolloRequests.listDeals({ apiKey: apiKeyOf(auth), query: { sort_by_field: apolloInputs.optionalText(propsValue.sort_by), page, per_page: perPage } });
    const deals = recordsOf(body['opportunities']).map((deal) => apolloMappers.deal(deal));
    return { ...apolloMappers.pageInfo({ body, page, perPage, returned: deals.length }), deals };
  },
});
