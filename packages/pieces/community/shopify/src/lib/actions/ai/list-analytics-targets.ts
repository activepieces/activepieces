import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { analyticsFields, analyticsMappers, GqlAnalyticsTarget } from '../../common/analytics';
import { listAnalyticsTargetsOutputSchema } from '../../output-schemas/analytics';

const MAX_PAGE_SIZE = 100;

export const shopifyAiListAnalyticsTargets = createAction({
  auth: shopifyAuth,
  name: 'list_analytics_targets',
  classification: 'SEARCH',
  displayName: 'List Analytics Targets',
  description: 'List and search the store\'s analytics targets (goals for a metric over a date range).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the store\'s analytics targets: merchant goals such as "total_sales of 50000 between 2026-01-01 and 2026-03-31". Use it to find a target id for update_analytics_target or delete_analytics_targets, or to check whether a target already exists before create_analytics_target. Each item has id (gid://shopify/AnalyticsTarget/…), name, metric, start_date, end_date, expected_value (exact decimal string), currency_code, filters (ShopifyQL filter expression or empty), shopifyql_query (a ShopifyQL query that returns the current value of the metric for the target, to compare progress) and timestamps. Filter with Shopify search syntax in query: "metric:total_sales", "name:Q1*", "start_date:>=2026-01-01", "end_date:<=2026-03-31", "filters:\\"shipping_country = \'US\'\\"". Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_reports access scope. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify search syntax, for example "metric:total_sales" or "start_date:>=2026-01-01 end_date:<=2026-12-31". Leave empty to list all.'
    ),
    sort_key: shopifyProps.staticChoice({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to ID.',
      required: false,
      values: analyticsFields.ANALYTICS_TARGET_SORT_KEYS,
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  outputSchema: listAnalyticsTargetsOutputSchema,
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      analyticsTargets: GqlConnection<GqlAnalyticsTarget> | null;
    }>({
      auth,
      query: `query ListAnalyticsTargets($first: Int!, $after: String, $reverse: Boolean, $sortKey: AnalyticsTargetSortKeys, $query: String) { analyticsTargets(first: $first, after: $after, reverse: $reverse, sortKey: $sortKey, query: $query) { nodes { ${analyticsFields.ANALYTICS_TARGET_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        reverse: propsValue.reverse ?? false,
        sortKey: shopifyValues.nonEmpty(propsValue.sort_key),
        query: shopifyValues.nonEmpty(propsValue.query),
      },
    });
    return shopifyMappers.toPage({
      connection: data.analyticsTargets,
      map: analyticsMappers.mapAnalyticsTarget,
      redactedFields,
    });
  },
});
