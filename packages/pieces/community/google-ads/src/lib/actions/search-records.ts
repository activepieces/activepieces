import { createAction, Property } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { GoogleAdsApi } from '../common/client';
import { customerIdProp } from '../common/props';
import { searchRecordsOutputSchema } from '../output-schemas';

const DEFAULT_MAX_ROWS = 1000;
const HARD_MAX_ROWS = 100_000;

export const searchRecords = createAction({
  name: 'searchRecords',
  classification: 'SEARCH',
  displayName: 'Search Records',
  description: 'Run a GAQL query (campaigns, ad groups, ads, keywords, audiences, reports) with pagination',
  audience: 'both',
  aiMetadata: {
    description:
      'Run a read-only Google Ads Query Language (GAQL) SELECT against one account and return the raw nested rows, one page at a time or all pages up to a row cap. Use to find campaigns, ad groups, ads, keywords or audience lists and their ids; for metrics over a date range with flat rows prefer Retrieve advertising report. Only SELECT is accepted; safe to retry.',
    idempotent: true,
  },
  auth: googleAdsAuth,
  props: {
    customerId: customerIdProp,
    query: Property.LongText({
      displayName: 'GAQL Query',
      description:
        'Google Ads Query Language SELECT statement. Examples: `SELECT campaign.id, campaign.name, campaign.status FROM campaign ORDER BY campaign.id` · `SELECT ad_group_criterion.criterion_id, ad_group_criterion.keyword.text FROM ad_group_criterion WHERE ad_group_criterion.type = KEYWORD` · `SELECT user_list.id, user_list.name FROM user_list`. Use `LIMIT` to cap the total.',
      required: true,
    }),
    fetchAllPages: Property.Checkbox({
      displayName: 'Fetch All Pages',
      description: 'Follow the pagination until the query is exhausted (up to Max Rows). Off: return one page and its next page token.',
      required: false,
      defaultValue: false,
    }),
    maxRows: Property.Number({
      displayName: 'Max Rows',
      description: `Only with "Fetch All Pages". Stops after this many rows (default ${DEFAULT_MAX_ROWS}, at most ${HARD_MAX_ROWS}).`,
      required: false,
      defaultValue: DEFAULT_MAX_ROWS,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'Only without "Fetch All Pages": the `nextPageToken` of a previous run to continue from.',
      required: false,
    }),
  },
  outputSchema: searchRecordsOutputSchema,
  async run(context) {
    const { customerId, query, fetchAllPages, maxRows, pageToken } = context.propsValue;

    if (fetchAllPages) {
      const cap = Math.min(Math.max(Number(maxRows) || DEFAULT_MAX_ROWS, 1), HARD_MAX_ROWS);
      const { results, truncated } = await GoogleAdsApi.searchAll({ auth: context.auth, customerId, query, maxRows: cap });
      return { results, count: results.length, truncated };
    }

    const page = await GoogleAdsApi.search({
      auth: context.auth,
      customerId,
      query,
      pageToken: pageToken || undefined,
    });
    const results = page.results ?? [];
    return {
      results,
      count: results.length,
      nextPageToken: page.nextPageToken ?? null,
    };
  },
});
