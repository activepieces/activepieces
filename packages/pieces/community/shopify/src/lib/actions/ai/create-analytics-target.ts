import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  ShopifyGraphqlResult,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyValues,
} from '../../common/graphql';
import {
  analyticsFields,
  analyticsMappers,
  analyticsValues,
  GqlAnalyticsTarget,
} from '../../common/analytics';
import { ShopifyAuth } from '../../common/types';
import { createAnalyticsTargetOutputSchema } from '../../output-schemas/analytics';

const TAKEN_CODE = 'TAKEN';
const LOOKUP_PAGE_SIZE = 50;

export const shopifyAiCreateAnalyticsTarget = createAction({
  auth: shopifyAuth,
  name: 'create_analytics_target',
  classification: 'WRITE',
  displayName: 'Create Analytics Target',
  description: 'Set a goal for an analytics metric over a date range, shown in Shopify Analytics.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates an analytics target: a merchant goal for one metric over a date range, for example total_sales of 50000 from 2026-01-01 to 2026-03-31, or 1000 orders in a month. Shopify Analytics then shows progress toward it. metric is a ShopifyQL metric identifier; Shopify documents total_sales and orders as examples and answers INVALID_METRIC for a metric that cannot have a target. expected_value must be greater than 0 and is in the shop currency for money metrics. filters is an optional ShopifyQL filter expression that narrows the data, for example shipping_country = \'US\'. A target is unique by metric + start_date + end_date + filters: if one already exists, this action returns that existing target unchanged with already_existed true (it does not change its name or expected_value; use update_analytics_target for that), so a retry never creates a duplicate. The returned id works with update_analytics_target and delete_analytics_targets; list_analytics_targets finds targets later. Needs the write_reports access scope (read_reports to look up an existing duplicate).',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Label for the target, for example "Q1 Sales Target".',
      required: true,
    }),
    metric: Property.ShortText({
      displayName: 'Metric',
      description:
        'ShopifyQL metric identifier in lower case, for example total_sales or orders. Shopify rejects metrics that cannot have a target (INVALID_METRIC).',
      required: true,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'First day of the target period, YYYY-MM-DD.',
      required: true,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'Last day of the target period, YYYY-MM-DD. Must not be before the start date.',
      required: true,
    }),
    expected_value: Property.Number({
      displayName: 'Expected Value',
      description: 'The goal value, greater than 0 (for money metrics, an amount in the shop currency).',
      required: true,
    }),
    filters: Property.ShortText({
      displayName: 'Filters',
      description:
        'Optional ShopifyQL filter expression that narrows the data, for example shipping_country = \'US\'. Leave empty to track the whole store.',
      required: false,
    }),
  },
  outputSchema: createAnalyticsTargetOutputSchema,
  async run({ auth, propsValue }) {
    const name = shopifyValues.nonEmpty(propsValue.name);
    if (name === undefined) {
      throw new Error('name is required. Nothing was changed.');
    }
    const metric = analyticsValues.readMetric(propsValue.metric);
    if (metric === undefined) {
      throw new Error('metric is required, for example total_sales. Nothing was changed.');
    }
    const startDate = shopifyValues.readIsoDate(propsValue.start_date);
    const endDate = shopifyValues.readIsoDate(propsValue.end_date);
    if (startDate === undefined || endDate === undefined) {
      throw new Error('start_date and end_date are required, as YYYY-MM-DD. Nothing was changed.');
    }
    analyticsValues.checkDateOrder({ start: startDate, end: endDate });
    const expectedValue = analyticsValues.readExpectedValue(propsValue.expected_value);
    if (expectedValue === undefined) {
      throw new Error('expected_value is required and must be greater than 0. Nothing was changed.');
    }
    const filters = shopifyValues.nonEmpty(propsValue.filters);
    const input = shopifyValues.compact({ name, metric, startDate, endDate, expectedValue, filters });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      analyticsTargetCreate: {
        analyticsTarget: GqlAnalyticsTarget | null;
        userErrors?: { field?: string[] | null; message?: string | null; code?: string | null }[] | null;
      } | null;
    }>({
      auth,
      query: `mutation CreateAnalyticsTarget($input: AnalyticsTargetCreateInput!) { analyticsTargetCreate(input: $input) { analyticsTarget { ${analyticsFields.ANALYTICS_TARGET_FIELDS} } userErrors { field message code } } }`,
      variables: { input },
      toleratedUserErrorCodes: [TAKEN_CODE],
    });
    const created = data.analyticsTargetCreate?.analyticsTarget;
    const taken = (data.analyticsTargetCreate?.userErrors ?? []).find((item) => item.code === TAKEN_CODE);
    if (created) {
      return {
        ...analyticsMappers.mapAnalyticsTarget(created),
        already_existed: taken !== undefined,
        redacted_fields: redactedFields,
      };
    }
    if (!taken) {
      throw new Error('Shopify did not return the created analytics target.');
    }
    const existing = await findExistingTarget({ auth, metric, startDate, endDate, filters });
    if (!existing) {
      throw new Error(
        `Shopify rejected the request: ${taken.message ?? 'the target already exists'} (TAKEN). No target with this metric, dates and filters was found with list_analytics_targets; check it there. Nothing was changed.`
      );
    }
    return {
      ...analyticsMappers.mapAnalyticsTarget(existing.target),
      already_existed: true,
      redacted_fields: [...redactedFields, ...existing.redactedFields],
    };
  },
});

async function findExistingTarget({
  auth,
  metric,
  startDate,
  endDate,
  filters,
}: {
  auth: ShopifyAuth;
  metric: string;
  startDate: string;
  endDate: string;
  filters: string | undefined;
}): Promise<{ target: GqlAnalyticsTarget; redactedFields: string[] } | null> {
  const search = `metric:${metric} start_date:${startDate} end_date:${endDate}`;
  const wanted = filters ?? '';
  let after: string | undefined = undefined;
  for (;;) {
    const response: ShopifyGraphqlResult<FindTargetsData> = await shopifyGraphqlClient.request<FindTargetsData>({
      auth,
      query: `query FindAnalyticsTarget($first: Int!, $after: String, $query: String) { analyticsTargets(first: $first, after: $after, query: $query) { nodes { ${analyticsFields.ANALYTICS_TARGET_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: { first: LOOKUP_PAGE_SIZE, after, query: search },
    });
    const { data, redactedFields } = response;
    const match = (data.analyticsTargets?.nodes ?? []).find(
      (target) =>
        target.metric === metric &&
        target.startDate === startDate &&
        target.endDate === endDate &&
        (target.filters ?? '').trim() === wanted
    );
    if (match) {
      return { target: match, redactedFields };
    }
    const pageInfo: GqlConnection<GqlAnalyticsTarget>['pageInfo'] = data.analyticsTargets?.pageInfo;
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor || pageInfo.endCursor === after) {
      return null;
    }
    after = pageInfo.endCursor;
  }
}

type FindTargetsData = {
  analyticsTargets: GqlConnection<GqlAnalyticsTarget> | null;
};
