import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlMarketingEngagement,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

const COUNT_FIELDS: [string, string][] = [
  ['impressions_count', 'impressionsCount'],
  ['views_count', 'viewsCount'],
  ['clicks_count', 'clicksCount'],
  ['shares_count', 'sharesCount'],
  ['favorites_count', 'favoritesCount'],
  ['comments_count', 'commentsCount'],
  ['unsubscribes_count', 'unsubscribesCount'],
  ['complaints_count', 'complaintsCount'],
  ['fails_count', 'failsCount'],
  ['sends_count', 'sendsCount'],
  ['unique_views_count', 'uniqueViewsCount'],
  ['unique_clicks_count', 'uniqueClicksCount'],
  ['sessions_count', 'sessionsCount'],
];

const DECIMAL_FIELDS: [string, string][] = [
  ['orders', 'orders'],
  ['first_time_customers', 'firstTimeCustomers'],
  ['returning_customers', 'returningCustomers'],
  ['primary_conversions', 'primaryConversions'],
  ['all_conversions', 'allConversions'],
];
import { marketingEngagementOutputSchema } from '../../output-schemas/store';

export const shopifyAiCreateMarketingEngagement = createAction({
  auth: shopifyAuth,
  name: 'create_marketing_engagement',
  classification: 'WRITE',
  displayName: 'Report Marketing Engagement',
  description: 'Report one day of engagement metrics for a marketing activity or channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Records engagement metrics (impressions, clicks, sends, ad spend, sales, conversions and so on) for ONE day, occurred_on, on an external marketing activity (by marketing_activity_id or remote_id) or on a whole channel (by channel_handle); pass exactly one of the three. The numbers are daily values for that day only, never running totals: Shopify phased out cumulative metrics, so this action always sends them as non-cumulative. Send at least one metric. Each call records another engagement entry, so do not repeat a day that was already reported. Needs the write_marketing_events access scope.',
    idempotent: false,
  },
  props: {
    marketing_activity_id: Property.ShortText({
      displayName: 'Marketing Activity ID',
      description: 'The activity id, numeric or "gid://shopify/MarketingActivity/…". Use this, the remote id, or a channel handle.',
      required: false,
    }),
    remote_id: Property.ShortText({
      displayName: 'Remote ID',
      description: 'Your own id the activity was created with, for example "fb-campaign-2026-spring".',
      required: false,
    }),
    channel_handle: Property.ShortText({
      displayName: 'Channel Handle',
      description: 'For channel-level metrics only: the channel handle your Shopify partner manager gave you. Leave empty for activity metrics.',
      required: false,
    }),
    occurred_on: Property.ShortText({
      displayName: 'Day',
      description: 'The day the metrics cover, YYYY-MM-DD, for example "2026-09-22".',
      required: true,
    }),
    utc_offset: Property.ShortText({
      displayName: 'UTC Offset',
      description: 'Time zone offset of that day, for example "+00:00" or "-05:00".',
      required: true,
    }),
    impressions_count: Property.Number({ displayName: 'Impressions', description: 'Times the content was shown that day.', required: false }),
    views_count: Property.Number({ displayName: 'Views', description: 'Views that day.', required: false }),
    clicks_count: Property.Number({ displayName: 'Clicks', description: 'Clicks that day.', required: false }),
    shares_count: Property.Number({ displayName: 'Shares', description: 'Shares that day.', required: false }),
    favorites_count: Property.Number({ displayName: 'Favorites', description: 'Favorites or likes that day.', required: false }),
    comments_count: Property.Number({ displayName: 'Comments', description: 'Comments that day.', required: false }),
    unsubscribes_count: Property.Number({ displayName: 'Unsubscribes', description: 'Unsubscribes that day.', required: false }),
    complaints_count: Property.Number({ displayName: 'Complaints', description: 'Spam complaints that day.', required: false }),
    fails_count: Property.Number({ displayName: 'Failed Sends', description: 'Messages that failed to send that day.', required: false }),
    sends_count: Property.Number({ displayName: 'Sends', description: 'Messages sent that day.', required: false }),
    unique_views_count: Property.Number({ displayName: 'Unique Views', description: 'Unique viewers that day.', required: false }),
    unique_clicks_count: Property.Number({ displayName: 'Unique Clicks', description: 'Unique clickers that day.', required: false }),
    sessions_count: Property.Number({ displayName: 'Sessions', description: 'Store sessions from the activity that day.', required: false }),
    orders: Property.Number({ displayName: 'Orders', description: 'Orders attributed to the activity that day (may be fractional for shared attribution).', required: false }),
    first_time_customers: Property.Number({ displayName: 'First-Time Customers', description: 'New customers attributed that day.', required: false }),
    returning_customers: Property.Number({ displayName: 'Returning Customers', description: 'Returning customers attributed that day.', required: false }),
    primary_conversions: Property.Number({ displayName: 'Primary Conversions', description: 'Primary conversions that day.', required: false }),
    all_conversions: Property.Number({ displayName: 'All Conversions', description: 'All conversions that day.', required: false }),
    ad_spend_amount: Property.Number({ displayName: 'Ad Spend', description: 'Amount spent that day, in the currency below.', required: false }),
    sales_amount: Property.Number({ displayName: 'Sales', description: 'Sales attributed that day, in the currency below.', required: false }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'ISO currency code of ad spend and sales, for example "USD". Needed when either is set.',
      required: false,
    }),
  },
  outputSchema: marketingEngagementOutputSchema,
  async run({ auth, propsValue }) {
    const occurredOn = shopifyValues.readIsoDate(propsValue.occurred_on);
    if (!occurredOn) {
      throw new Error('occurred_on is required, YYYY-MM-DD. Nothing was recorded.');
    }
    const utcOffset = shopifyValues.nonEmpty(propsValue.utc_offset);
    if (!utcOffset || !/^[+-]\d{2}:\d{2}$/.test(utcOffset)) {
      throw new Error('utc_offset must look like "+00:00" or "-05:00". Nothing was recorded.');
    }
    const values: Record<string, unknown> = propsValue;
    const metrics: Record<string, unknown> = {};
    for (const [prop, field] of COUNT_FIELDS) {
      const value = values[prop];
      if (value === undefined || value === null) {
        continue;
      }
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        throw new Error(`${prop} must be a whole number of 0 or more. Nothing was recorded.`);
      }
      metrics[field] = value;
    }
    for (const [prop, field] of DECIMAL_FIELDS) {
      const value = values[prop];
      if (value === undefined || value === null) {
        continue;
      }
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new Error(`${prop} must be 0 or more. Nothing was recorded.`);
      }
      metrics[field] = String(value);
    }
    const money = shopifyValues.compact({
      adSpend: shopifyValues.buildMoneyInput({ amount: propsValue.ad_spend_amount, currency: propsValue.currency, label: 'ad_spend_amount' }),
      sales: shopifyValues.buildMoneyInput({ amount: propsValue.sales_amount, currency: propsValue.currency, label: 'sales_amount' }),
    });
    if (Object.keys(metrics).length === 0 && Object.keys(money).length === 0) {
      throw new Error('Send at least one metric for the day. Nothing was recorded.');
    }
    const target = readTarget({
      marketingActivityId: propsValue.marketing_activity_id,
      remoteId: propsValue.remote_id,
      channelHandle: propsValue.channel_handle,
    });
    const marketingEngagement = {
      occurredOn,
      utcOffset,
      ...metrics,
      ...money,
      isCumulative: false,
    };
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      marketingEngagementCreate: { marketingEngagement: GqlMarketingEngagement | null } | null;
    }>({
      auth,
      query: `mutation CreateMarketingEngagement($marketingActivityId: ID, $remoteId: String, $channelHandle: String, $marketingEngagement: MarketingEngagementInput!) { marketingEngagementCreate(marketingActivityId: $marketingActivityId, remoteId: $remoteId, channelHandle: $channelHandle, marketingEngagement: $marketingEngagement) { marketingEngagement { ${shopifyFields.MARKETING_ENGAGEMENT_FIELDS} } userErrors { field message code } } }`,
      variables: { ...target, marketingEngagement },
    });
    const engagement = data.marketingEngagementCreate?.marketingEngagement;
    if (!engagement) {
      throw new Error('Shopify did not return the recorded engagement.');
    }
    return {
      ...shopifyMappers.mapMarketingEngagement(engagement),
      redacted_fields: redactedFields,
    };
  },
});

function readTarget({
  marketingActivityId,
  remoteId,
  channelHandle,
}: {
  marketingActivityId: string | undefined | null;
  remoteId: string | undefined | null;
  channelHandle: string | undefined | null;
}): { marketingActivityId?: string; remoteId?: string; channelHandle?: string } {
  const handle = shopifyValues.nonEmpty(channelHandle);
  const hasActivity = shopifyValues.nonEmpty(marketingActivityId) !== undefined || shopifyValues.nonEmpty(remoteId) !== undefined;
  if (handle && hasActivity) {
    throw new Error('Pass exactly one of marketing_activity_id, remote_id or channel_handle. Nothing was recorded.');
  }
  if (handle) {
    return { channelHandle: handle };
  }
  return shopifyValues.readMarketingActivityTarget({ marketingActivityId, remoteId });
}
