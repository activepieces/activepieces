import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyCampaignAnalytics } from '../common/types';

export const getCampaignAnalyticsAction = createAction({
  auth: instantlyAuth,
  name: 'get_campaign_analytics',
  classification: 'READ',
  displayName: 'Get Campaign Analytics',
  description: 'Gets analytics data for a specific campaign.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves performance analytics for a single Instantly campaign by campaign ID — leads contacted, emails sent, opens, link clicks, replies, bounces, unsubscribes, completed leads, and opportunities — optionally scoped to a start and end date. Use to report on campaign results. Read-only and idempotent.', idempotent: true },
  props: {
    campaign_id: instantlyProps.campaignId(true),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date for the analytics period.',
      required: false,
    }),
    end_date: Property.DateTime({
      displayName: 'End Date',
      description: 'End date for the analytics period.',
      required: false,
    }),
  },
  async run(context) {
    const { campaign_id, start_date, end_date } = context.propsValue;

    const analytics = await instantlyClient.makeRequest<
      InstantlyCampaignAnalytics[]
    >({
      auth: context.auth.secret_text,
      method: HttpMethod.GET,
      path: 'campaigns/analytics',
      query: {
        id: campaign_id,
        start_date,
        end_date,
      },
    });

    const campaignAnalytics = analytics[0];
    if (!campaignAnalytics) {
      throw new Error(`No analytics found for campaign ${campaign_id}.`);
    }

    return campaignAnalytics;
  },
});
