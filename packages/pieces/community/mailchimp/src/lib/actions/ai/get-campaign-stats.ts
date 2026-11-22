import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../../..';
import { mailchimpApi } from '../../common/client';
import { mailchimpOutputSchemas } from '../../common/output-schemas';

export const getCampaignStatsAi = createAction({
  auth: mailchimpAuth,
  name: 'get_campaign_stats',
  classification: 'READ',
  displayName: 'Get Campaign Stats',
  description: 'Get the headline performance numbers of a sent campaign.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns the headline numbers of a sent campaign (campaign_id from List Campaigns with status sent): emails sent, opens, unique opens, open rate, clicks, unique clicks, click rate, unsubscribes and bounces. Rates are fractions between 0 and 1. Fails if the campaign was never sent. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['aiCampaignStats'],
  props: {
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'Campaign ID, from List Campaigns or Find Campaign.',
      required: true,
    }),
  },
  async run(context) {
    const campaignId = mailchimpApi.requireText({ value: context.propsValue.campaign_id, label: 'Campaign ID' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const report = await client.request<Report>({
      method: HttpMethod.GET,
      path: `/reports/${encodeURIComponent(campaignId)}`,
      queryParams: { exclude_fields: 'share_report,_links,timeseries,timewarp' },
      operation: 'get campaign stats',
    });
    return {
      campaign_id: report.id,
      title: report.campaign_title ?? null,
      send_time: report.send_time || null,
      emails_sent: report.emails_sent ?? 0,
      opens: report.opens?.opens_total ?? 0,
      unique_opens: report.opens?.unique_opens ?? 0,
      open_rate: report.opens?.open_rate ?? 0,
      clicks: report.clicks?.clicks_total ?? 0,
      unique_clicks: report.clicks?.unique_clicks ?? 0,
      click_rate: report.clicks?.click_rate ?? 0,
      unsubscribes: report.unsubscribed ?? 0,
      bounces: (report.bounces?.hard_bounces ?? 0) + (report.bounces?.soft_bounces ?? 0),
    };
  },
});

type Report = {
  id: string;
  campaign_title?: string;
  send_time?: string;
  emails_sent?: number;
  unsubscribed?: number;
  opens?: { opens_total?: number; unique_opens?: number; open_rate?: number };
  clicks?: { clicks_total?: number; unique_clicks?: number; click_rate?: number };
  bounces?: { hard_bounces?: number; soft_bounces?: number };
};
