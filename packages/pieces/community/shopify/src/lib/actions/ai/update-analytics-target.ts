import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';
import {
  analyticsFields,
  analyticsMappers,
  analyticsValues,
  GqlAnalyticsTarget,
} from '../../common/analytics';
import { analyticsTargetOutputSchema } from '../../output-schemas/analytics';

export const shopifyAiUpdateAnalyticsTarget = createAction({
  auth: shopifyAuth,
  name: 'update_analytics_target',
  classification: 'WRITE',
  displayName: 'Update Analytics Target',
  description: 'Change the name, metric, dates, goal value or filters of an analytics target.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes one analytics target and returns it; every field you leave empty keeps its value. Use it to raise or lower a goal (expected_value, greater than 0), rename it, move its period (start_date/end_date as YYYY-MM-DD) or change its metric or ShopifyQL filters (for example shipping_country = \'US\'). Set clear_filters to make it track the whole store again. Shopify keeps targets unique by metric + start_date + end_date + filters and answers TAKEN when the change would collide with another target. Get the target id from list_analytics_targets or create_analytics_target. Repeating the same update leaves the same state. Needs the write_reports access scope.',
    idempotent: true,
  },
  props: {
    target_id: Property.ShortText({
      displayName: 'Analytics Target ID',
      description: 'The target id, numeric or "gid://shopify/AnalyticsTarget/…". Find it with list_analytics_targets.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New label for the target. Leave empty to keep it.',
      required: false,
    }),
    metric: Property.ShortText({
      displayName: 'Metric',
      description: 'New ShopifyQL metric identifier, for example total_sales or orders. Leave empty to keep it.',
      required: false,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'New first day of the period, YYYY-MM-DD. Leave empty to keep it.',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'New last day of the period, YYYY-MM-DD. Leave empty to keep it.',
      required: false,
    }),
    expected_value: Property.Number({
      displayName: 'Expected Value',
      description: 'New goal value, greater than 0. Leave empty to keep it.',
      required: false,
    }),
    filters: Property.ShortText({
      displayName: 'Filters',
      description: 'New ShopifyQL filter expression, for example shipping_country = \'US\'. Leave empty to keep the current filters.',
      required: false,
    }),
    clear_filters: Property.Checkbox({
      displayName: 'Clear Filters',
      description: 'Remove the filters so the target tracks the whole store. Do not combine with Filters.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: analyticsTargetOutputSchema,
  async run({ auth, propsValue }) {
    const startDate = shopifyValues.readIsoDate(propsValue.start_date);
    const endDate = shopifyValues.readIsoDate(propsValue.end_date);
    analyticsValues.checkDateOrder({ start: startDate, end: endDate });
    const input = shopifyValues.compact({
      name: shopifyValues.nonEmpty(propsValue.name),
      metric: analyticsValues.readMetric(propsValue.metric),
      startDate,
      endDate,
      expectedValue: analyticsValues.readExpectedValue(propsValue.expected_value),
      filters: shopifyValues.clearableValue({
        value: shopifyValues.nonEmpty(propsValue.filters),
        clear: propsValue.clear_filters,
        valueName: 'filters',
        clearName: 'clear_filters',
      }),
    });
    if (Object.keys(input).length === 0) {
      throw new Error(
        'Nothing to update: provide name, metric, start_date, end_date, expected_value, filters or clear_filters. Nothing was changed.'
      );
    }
    const id = shopifyGraphqlClient.toGid({ type: 'AnalyticsTarget', id: propsValue.target_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      analyticsTargetUpdate: { analyticsTarget: GqlAnalyticsTarget | null } | null;
    }>({
      auth,
      query: `mutation UpdateAnalyticsTarget($id: ID!, $input: AnalyticsTargetUpdateInput!) { analyticsTargetUpdate(id: $id, input: $input) { analyticsTarget { ${analyticsFields.ANALYTICS_TARGET_FIELDS} } userErrors { field message code } } }`,
      variables: { id, input },
    });
    const target = data.analyticsTargetUpdate?.analyticsTarget;
    if (!target) {
      throw new Error('Shopify did not return the updated analytics target.');
    }
    return {
      ...analyticsMappers.mapAnalyticsTarget(target),
      redacted_fields: redactedFields,
    };
  },
});
