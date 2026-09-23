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

export const shopifyAiUpdateExternalMarketingActivity = createAction({
  auth: shopifyAuth,
  name: 'update_external_marketing_activity',
  classification: 'WRITE',
  displayName: 'Update External Marketing Activity',
  description: 'Change some fields of an external marketing activity.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes only the fields you send on one external marketing activity and returns it; fields you leave empty keep their value (unlike upsert_external_marketing_activity, which replaces the whole activity). Identify the activity by exactly one of: marketing_activity_id, remote_id, or the three UTM values it was created with. UTM values, the URL parameter, the channel handle, the parent and the hierarchy level cannot be changed here. Repeating the same update leaves the same state. Needs the write_marketing_events access scope.',
    idempotent: true,
  },
  props: {
    marketing_activity_id: Property.ShortText({
      displayName: 'Marketing Activity ID',
      description: 'The activity id, numeric or "gid://shopify/MarketingActivity/…". Use this, the remote id, or the UTM values.',
      required: false,
    }),
    remote_id: Property.ShortText({
      displayName: 'Remote ID',
      description: 'Your own id the activity was created with, for example "fb-campaign-2026-spring".',
      required: false,
    }),
    utm_campaign: Property.ShortText({
      displayName: 'UTM Campaign (to find the activity)',
      description: 'utm_campaign the activity was created with. Set all three UTM values to identify the activity by them.',
      required: false,
    }),
    utm_source: Property.ShortText({
      displayName: 'UTM Source (to find the activity)',
      description: 'utm_source the activity was created with.',
      required: false,
    }),
    utm_medium: Property.ShortText({
      displayName: 'UTM Medium (to find the activity)',
      description: 'utm_medium the activity was created with.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title.',
      required: false,
    }),
    status: shopifyProps.staticChoice({
      displayName: 'Status',
      description: 'New state of the activity on the external platform.',
      required: false,
      values: shopifyFields.MARKETING_EXTERNAL_STATUSES,
    }),
    tactic: shopifyProps.staticChoice({
      displayName: 'Tactic',
      description: 'New tactic. An activity cannot be changed to or from STOREFRONT_APP.',
      required: false,
      values: shopifyFields.MARKETING_TACTICS,
    }),
    marketing_channel_type: shopifyProps.staticChoice({
      displayName: 'Channel Type',
      description: 'New channel type.',
      required: false,
      values: shopifyFields.MARKETING_CHANNELS,
    }),
    remote_url: Property.ShortText({
      displayName: 'Remote URL',
      description: 'New URL where the merchant manages the activity.',
      required: false,
    }),
    remote_preview_image_url: Property.ShortText({
      displayName: 'Preview Image URL',
      description: 'New public preview image URL.',
      required: false,
    }),
    referring_domain: Property.ShortText({
      displayName: 'Referring Domain',
      description: 'New referring domain, for example "facebook.com".',
      required: false,
    }),
    budget_type: shopifyProps.staticChoice({
      displayName: 'Budget Type',
      description: 'DAILY or LIFETIME. Set together with the budget amount; the pair replaces the stored budget.',
      required: false,
      values: shopifyFields.MARKETING_BUDGET_TYPES,
    }),
    budget_amount: Property.Number({
      displayName: 'Budget Amount',
      description: 'New budget total, in the currency below.',
      required: false,
    }),
    ad_spend_amount: Property.Number({
      displayName: 'Ad Spend',
      description: 'New total spent so far, in the currency below.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'ISO currency code of the budget and ad spend, for example "USD". Needed when either is set.',
      required: false,
    }),
    scheduled_start: Property.DateTime({
      displayName: 'Scheduled Start',
      description: 'New planned start time, ISO 8601.',
      required: false,
    }),
    scheduled_end: Property.DateTime({
      displayName: 'Scheduled End',
      description: 'New planned end time, ISO 8601.',
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
    const budgetTotal = shopifyValues.buildMoneyInput({
      amount: propsValue.budget_amount,
      currency: propsValue.currency,
      label: 'budget_amount',
    });
    if ((budgetTotal === undefined) !== (propsValue.budget_type === undefined || propsValue.budget_type === null)) {
      throw new Error('Set budget_type and budget_amount together, or neither. Nothing was changed.');
    }
    const input = shopifyValues.compact({
      title: shopifyValues.nonEmpty(propsValue.title),
      status: propsValue.status ?? undefined,
      tactic: propsValue.tactic ?? undefined,
      marketingChannelType: propsValue.marketing_channel_type ?? undefined,
      remoteUrl: shopifyValues.nonEmpty(propsValue.remote_url),
      remotePreviewImageUrl: shopifyValues.nonEmpty(propsValue.remote_preview_image_url),
      referringDomain: shopifyValues.nonEmpty(propsValue.referring_domain),
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
    if (Object.keys(input).length === 0) {
      throw new Error('Nothing to update: provide at least one field to change. Nothing was changed.');
    }
    const target = readTarget({
      marketingActivityId: propsValue.marketing_activity_id,
      remoteId: propsValue.remote_id,
      utmCampaign: propsValue.utm_campaign,
      utmSource: propsValue.utm_source,
      utmMedium: propsValue.utm_medium,
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      marketingActivityUpdateExternal: { marketingActivity: GqlMarketingActivity | null } | null;
    }>({
      auth,
      query: `mutation UpdateExternalMarketingActivity($input: MarketingActivityUpdateExternalInput!, $marketingActivityId: ID, $remoteId: String, $utm: UTMInput) { marketingActivityUpdateExternal(input: $input, marketingActivityId: $marketingActivityId, remoteId: $remoteId, utm: $utm) { marketingActivity { ${shopifyFields.MARKETING_ACTIVITY_FIELDS} } userErrors { field message code } } }`,
      variables: { input, ...target },
    });
    const activity = data.marketingActivityUpdateExternal?.marketingActivity;
    if (!activity) {
      throw new Error('Shopify did not return the updated marketing activity.');
    }
    return {
      ...shopifyMappers.mapMarketingActivity(activity),
      redacted_fields: redactedFields,
    };
  },
});

function readTarget({
  marketingActivityId,
  remoteId,
  utmCampaign,
  utmSource,
  utmMedium,
}: {
  marketingActivityId: string | undefined | null;
  remoteId: string | undefined | null;
  utmCampaign: string | undefined | null;
  utmSource: string | undefined | null;
  utmMedium: string | undefined | null;
}): { marketingActivityId?: string; remoteId?: string; utm?: { campaign: string; source: string; medium: string } } {
  const utm = shopifyValues.buildUtm({ campaign: utmCampaign, source: utmSource, medium: utmMedium });
  const hasId = shopifyValues.nonEmpty(marketingActivityId) !== undefined || shopifyValues.nonEmpty(remoteId) !== undefined;
  if (utm && hasId) {
    throw new Error('Identify the activity by exactly one of marketing_activity_id, remote_id or the UTM values. Nothing was changed.');
  }
  if (utm) {
    return { utm };
  }
  return shopifyValues.readMarketingActivityTarget({ marketingActivityId, remoteId });
}
