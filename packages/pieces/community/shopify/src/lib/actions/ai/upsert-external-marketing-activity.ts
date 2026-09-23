import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlMarketingActivity,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiUpsertExternalMarketingActivity = createAction({
  auth: shopifyAuth,
  name: 'upsert_external_marketing_activity',
  classification: 'WRITE',
  displayName: 'Upsert External Marketing Activity',
  description: 'Create or fully replace an external marketing activity, keyed by your remote id.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates an external marketing activity (a campaign, ad or email run outside Shopify) or, when one with the same remote_id already exists, REPLACES it, and returns the activity. Replace means every optional field you leave empty is REMOVED from the existing activity (UTM values, budget, ad spend, schedule, preview image and so on), so always send the complete desired activity; to change only a few fields of an existing activity use update_external_marketing_activity instead. An activity with no hierarchy level must carry either the three UTM values or a url_parameter_value; UTM values, the URL parameter, the channel handle, the parent and the hierarchy level cannot be changed after creation. Repeating the same call leaves the same state. Report engagement numbers afterwards with create_marketing_engagement. Needs the write_marketing_events access scope.',
    idempotent: true,
  },
  props: {
    remote_id: Property.ShortText({
      displayName: 'Remote ID',
      description: 'Your own unique id for this activity, for example "fb-campaign-2026-spring". The same remote id updates the same activity.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Name shown in the Shopify marketing section, for example "Spring sale Facebook ads".',
      required: true,
    }),
    status: shopifyProps.staticChoice({
      displayName: 'Status',
      description: 'Current state of the activity on the external platform.',
      required: true,
      values: shopifyFields.MARKETING_EXTERNAL_STATUSES,
    }),
    remote_url: Property.ShortText({
      displayName: 'Remote URL',
      description: 'URL where the merchant manages this activity on the external platform, for example "https://ads.example.com/campaigns/42".',
      required: true,
    }),
    tactic: shopifyProps.staticChoice({
      displayName: 'Tactic',
      description: 'The kind of marketing, for example AD, NEWSLETTER or POST.',
      required: true,
      values: shopifyFields.MARKETING_TACTICS,
    }),
    marketing_channel_type: shopifyProps.staticChoice({
      displayName: 'Channel Type',
      description: 'The channel the activity runs on.',
      required: true,
      values: shopifyFields.MARKETING_CHANNELS,
    }),
    utm_campaign: Property.ShortText({
      displayName: 'UTM Campaign',
      description: 'utm_campaign value of the activity links, for example "spring-sale". Set all three UTM values or none. Cannot be changed later.',
      required: false,
    }),
    utm_source: Property.ShortText({
      displayName: 'UTM Source',
      description: 'utm_source value, for example "facebook".',
      required: false,
    }),
    utm_medium: Property.ShortText({
      displayName: 'UTM Medium',
      description: 'utm_medium value, for example "cpc".',
      required: false,
    }),
    url_parameter_value: Property.ShortText({
      displayName: 'URL Parameter Value',
      description: 'Value of the tracking URL parameter used instead of UTM values. Cannot be changed later.',
      required: false,
    }),
    hierarchy_level: shopifyProps.staticChoice({
      displayName: 'Hierarchy Level',
      description: 'Optional level when the activity is part of a campaign tree (CAMPAIGN, AD_GROUP or AD). Cannot be changed later.',
      required: false,
      values: shopifyFields.MARKETING_HIERARCHY_LEVELS,
    }),
    parent_remote_id: Property.ShortText({
      displayName: 'Parent Remote ID',
      description: 'Remote id of the parent activity in the campaign tree. Cannot be changed later.',
      required: false,
    }),
    channel_handle: Property.ShortText({
      displayName: 'Channel Handle',
      description: 'Handle of the sales channel the activity belongs to, if your partner manager gave you one. Cannot be changed later.',
      required: false,
    }),
    referring_domain: Property.ShortText({
      displayName: 'Referring Domain',
      description: 'Domain visitors arrive from, for example "facebook.com".',
      required: false,
    }),
    remote_preview_image_url: Property.ShortText({
      displayName: 'Preview Image URL',
      description: 'Public URL of a preview image of the ad or email.',
      required: false,
    }),
    budget_type: shopifyProps.staticChoice({
      displayName: 'Budget Type',
      description: 'DAILY or LIFETIME. Set together with the budget amount.',
      required: false,
      values: shopifyFields.MARKETING_BUDGET_TYPES,
    }),
    budget_amount: Property.Number({
      displayName: 'Budget Amount',
      description: 'Budget total, for example 500 for 500.00, in the currency below.',
      required: false,
    }),
    ad_spend_amount: Property.Number({
      displayName: 'Ad Spend',
      description: 'Amount spent so far, in the currency below.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'ISO currency code of the budget and ad spend, for example "USD". Needed when either is set.',
      required: false,
    }),
    scheduled_start: Property.DateTime({
      displayName: 'Scheduled Start',
      description: 'Planned start time, ISO 8601.',
      required: false,
    }),
    scheduled_end: Property.DateTime({
      displayName: 'Scheduled End',
      description: 'Planned end time, ISO 8601.',
      required: false,
    }),
    start: Property.DateTime({
      displayName: 'Actual Start',
      description: 'When the activity really started, ISO 8601.',
      required: false,
    }),
    end: Property.DateTime({
      displayName: 'Actual End',
      description: 'When the activity really ended, ISO 8601.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const utm = shopifyValues.buildUtm({
      campaign: propsValue.utm_campaign,
      source: propsValue.utm_source,
      medium: propsValue.utm_medium,
    });
    const budgetTotal = shopifyValues.buildMoneyInput({
      amount: propsValue.budget_amount,
      currency: propsValue.currency,
      label: 'budget_amount',
    });
    if ((budgetTotal === undefined) !== (propsValue.budget_type === undefined || propsValue.budget_type === null)) {
      throw new Error('Set budget_type and budget_amount together, or neither. Nothing was changed.');
    }
    const input = shopifyValues.compact({
      remoteId: requireText({ value: propsValue.remote_id, name: 'remote_id' }),
      title: requireText({ value: propsValue.title, name: 'title' }),
      status: propsValue.status,
      remoteUrl: requireText({ value: propsValue.remote_url, name: 'remote_url' }),
      tactic: propsValue.tactic,
      marketingChannelType: propsValue.marketing_channel_type,
      utm,
      urlParameterValue: shopifyValues.nonEmpty(propsValue.url_parameter_value),
      hierarchyLevel: propsValue.hierarchy_level ?? undefined,
      parentRemoteId: shopifyValues.nonEmpty(propsValue.parent_remote_id),
      channelHandle: shopifyValues.nonEmpty(propsValue.channel_handle),
      referringDomain: shopifyValues.nonEmpty(propsValue.referring_domain),
      remotePreviewImageUrl: shopifyValues.nonEmpty(propsValue.remote_preview_image_url),
      budget: budgetTotal ? { budgetType: propsValue.budget_type, total: budgetTotal } : undefined,
      adSpend: shopifyValues.buildMoneyInput({
        amount: propsValue.ad_spend_amount,
        currency: propsValue.currency,
        label: 'ad_spend_amount',
      }),
      scheduledStart: shopifyValues.nonEmpty(propsValue.scheduled_start),
      scheduledEnd: shopifyValues.nonEmpty(propsValue.scheduled_end),
      start: shopifyValues.nonEmpty(propsValue.start),
      end: shopifyValues.nonEmpty(propsValue.end),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      marketingActivityUpsertExternal: { marketingActivity: GqlMarketingActivity | null } | null;
    }>({
      auth,
      query: `mutation UpsertExternalMarketingActivity($input: MarketingActivityUpsertExternalInput!) { marketingActivityUpsertExternal(input: $input) { marketingActivity { ${shopifyFields.MARKETING_ACTIVITY_FIELDS} } userErrors { field message code } } }`,
      variables: { input },
    });
    const activity = data.marketingActivityUpsertExternal?.marketingActivity;
    if (!activity) {
      throw new Error('Shopify did not return the marketing activity.');
    }
    return {
      ...shopifyMappers.mapMarketingActivity(activity),
      redacted_fields: redactedFields,
    };
  },
});

function requireText({ value, name }: { value: string | undefined | null; name: string }): string {
  const text = shopifyValues.nonEmpty(value);
  if (!text) {
    throw new Error(`${name} is required. Nothing was changed.`);
  }
  return text;
}
