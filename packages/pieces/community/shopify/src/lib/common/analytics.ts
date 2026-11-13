const ANALYTICS_TARGET_FIELDS =
  'id name metric startDate endDate expectedValue currencyCode filters shopifyqlQuery createdAt updatedAt';

const ANALYTICS_ANNOTATION_FIELDS =
  'id type title description startedAt endedAt source createdAt updatedAt';

const ANNOTATION_TITLE_MAX = 75;

const ANNOTATION_DESCRIPTION_MAX = 150;

const ANALYTICS_TARGET_SORT_KEYS = [
  'START_DATE',
  'END_DATE',
  'NAME',
  'METRIC',
  'EXPECTED_VALUE',
  'CREATED_AT',
  'ID',
];

const ANALYTICS_ANNOTATION_TYPES = [
  'product_launch',
  'product_discontinuation',
  'collection_launch',
  'bundle_launch',
  'preorder_launch',
  'in_person_event',
  'campaign',
  'brand_change',
  'influencer_collaboration',
  'brand_collaboration',
  'channel_launch',
  'ad_spend_change',
  'media_mention',
  'attribution_change',
  'checkout_offer',
  'amount_off_products_discount',
  'free_shipping_discount',
  'buy_x_get_y_discount',
  'amount_off_order_discount',
  'seasonal_promotion',
  'shipping_promotion',
  'loyalty_program_offer',
  'reward_program_offer',
  'subscription_program_offer',
  'shop_cash_offer',
  'pricing_experiment',
  'supplier_change',
  'warehouse_change',
  'fulfillment_service_change',
  'landing_page_launch',
  'store_redesign',
  'payment_method_change',
  'retail_store_change',
  'popup_store',
  'revenue_milestone',
  'order_milestone',
  'customer_milestone',
  'capital_funding',
  'expansion_milestone',
  'award_recognition',
  'anniversary',
  'market_change',
  'tax_change',
  'loyalty_program_change',
  'reward_program_change',
  'subscription_program_change',
  'retention_program_change',
  'return_program_change',
  'external_event',
  'team_change',
  'other',
];

function mapAnalyticsTarget(target: GqlAnalyticsTarget) {
  return {
    id: target.id,
    name: target.name ?? null,
    metric: target.metric ?? null,
    start_date: target.startDate ?? null,
    end_date: target.endDate ?? null,
    expected_value: target.expectedValue === null || target.expectedValue === undefined ? null : String(target.expectedValue),
    currency_code: target.currencyCode ?? null,
    filters: target.filters ?? null,
    shopifyql_query: target.shopifyqlQuery ?? null,
    created_at: target.createdAt ?? null,
    updated_at: target.updatedAt ?? null,
  };
}

function mapAnalyticsAnnotation(annotation: GqlAnalyticsAnnotation) {
  return {
    id: annotation.id,
    type: annotation.type ?? null,
    title: annotation.title ?? null,
    description: annotation.description ?? null,
    started_at: annotation.startedAt ?? null,
    ended_at: annotation.endedAt ?? null,
    source: annotation.source ?? null,
    created_at: annotation.createdAt ?? null,
    updated_at: annotation.updatedAt ?? null,
  };
}

function readMetric(value: string | undefined | null): string | undefined {
  const text = (value ?? '').trim();
  if (text.length === 0) {
    return undefined;
  }
  if (!/^[a-z][a-z0-9_]*$/.test(text)) {
    throw new Error(
      `"${text}" is not a metric identifier. Use a lower-case ShopifyQL metric name such as total_sales or orders. Nothing was changed.`
    );
  }
  return text;
}

function readExpectedValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const text = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(text) || Number(text) <= 0) {
    throw new Error(`expected_value must be a number greater than 0, got "${text}". Nothing was changed.`);
  }
  return text;
}

function checkDateOrder({ start, end }: { start: string | undefined; end: string | undefined }): void {
  if (start !== undefined && end !== undefined && start > end) {
    throw new Error(`start_date ${start} is after end_date ${end}. Nothing was changed.`);
  }
}

function isRealCalendarDate(text: string): boolean {
  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function readDateTime({ value, label }: { value: string | undefined | null; label: string }): string | undefined {
  const text = (value ?? '').trim();
  if (text.length === 0) {
    return undefined;
  }
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
  if (!isoPattern.test(text) || !Number.isFinite(Date.parse(text)) || !isRealCalendarDate(text.slice(0, 10))) {
    throw new Error(
      `${label} "${text}" is not an ISO 8601 date-time with a time zone, for example 2026-11-28T00:00:00Z. Nothing was changed.`
    );
  }
  return text;
}

function checkDateTimeOrder({ startedAt, endedAt }: { startedAt: string | undefined; endedAt: string | undefined }): void {
  if (startedAt !== undefined && endedAt !== undefined && Date.parse(endedAt) < Date.parse(startedAt)) {
    throw new Error(`ended_at ${endedAt} is before started_at ${startedAt}. Nothing was changed.`);
  }
}

function readAnnotationType(value: string | undefined | null): string | undefined {
  const text = (value ?? '').trim();
  if (text.length === 0) {
    return undefined;
  }
  if (!ANALYTICS_ANNOTATION_TYPES.includes(text)) {
    throw new Error(
      `"${text}" is not an annotation type apps can set. Use one of: ${ANALYTICS_ANNOTATION_TYPES.join(', ')}. Nothing was changed.`
    );
  }
  return text;
}

function readBoundedText({
  value,
  label,
  max,
}: {
  value: string | undefined | null;
  label: string;
  max: number;
}): string | undefined {
  const text = (value ?? '').trim();
  if (text.length === 0) {
    return undefined;
  }
  if ([...text].length > max) {
    throw new Error(`${label} is ${[...text].length} characters; Shopify allows at most ${max}. Nothing was changed.`);
  }
  return text;
}

export const analyticsFields = {
  ANALYTICS_TARGET_FIELDS,
  ANALYTICS_ANNOTATION_FIELDS,
  ANALYTICS_TARGET_SORT_KEYS,
  ANALYTICS_ANNOTATION_TYPES,
  ANNOTATION_TITLE_MAX,
  ANNOTATION_DESCRIPTION_MAX,
};

export const analyticsMappers = {
  mapAnalyticsTarget,
  mapAnalyticsAnnotation,
};

export const analyticsValues = {
  readMetric,
  readExpectedValue,
  checkDateOrder,
  readDateTime,
  checkDateTimeOrder,
  readAnnotationType,
  readBoundedText,
};

export type GqlAnalyticsTarget = {
  id: string;
  name?: string | null;
  metric?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  expectedValue?: string | number | null;
  currencyCode?: string | null;
  filters?: string | null;
  shopifyqlQuery?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GqlAnalyticsAnnotation = {
  id: string;
  type?: string | null;
  title?: string | null;
  description?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  source?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
