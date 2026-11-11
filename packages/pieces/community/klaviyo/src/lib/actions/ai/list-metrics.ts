import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../common/auth';
import { equalsFilter, isRecord, klaviyoApi, KlaviyoResource } from '../../common/client';
import { klaviyoInputs } from '../../common/ai-props';
import { klaviyoOutputSchemas } from '../../common/output-schemas';

export const listMetricsAi = createAction({
  auth: klaviyoAuth,
  name: 'list_metrics_ai',
  classification: 'SEARCH',
  displayName: 'List Metrics',
  description: 'List Klaviyo metrics (event types), one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Klaviyo metrics, the event types such as "Placed Order" or "Opened Email", with their IDs and source integration. Use to find the metric ID needed by List Events. Pass next_cursor back as cursor for more. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.aiMetricPage,
  props: {
    integration_name: Property.ShortText({ displayName: 'Integration Name', description: 'Only metrics from this integration, e.g. "Klaviyo", "Shopify" or "API".', required: false }),
    cursor: klaviyoInputs.cursorProp(),
  },
  async run({ auth, propsValue }) {
    const integration = klaviyoInputs.optionalText(propsValue.integration_name);
    const page = await klaviyoApi.listPage({
      auth,
      path: '/metrics',
      query: { filter: integration === undefined ? undefined : equalsFilter({ field: 'integration.name', value: integration }) },
      cursor: klaviyoInputs.optionalText(propsValue.cursor),
    });
    return klaviyoInputs.pageOutput({ page, map: flatMetric });
  },
});

function flatMetric(metric: KlaviyoResource): Record<string, unknown> {
  const integration = isRecord(metric.attributes['integration']) ? metric.attributes['integration'] : {};
  return {
    id: metric.id,
    name: metric.attributes['name'] ?? null,
    created: metric.attributes['created'] ?? null,
    updated: metric.attributes['updated'] ?? null,
    integration: {
      name: integration['name'] ?? null,
      category: integration['category'] ?? null,
    },
  };
}
