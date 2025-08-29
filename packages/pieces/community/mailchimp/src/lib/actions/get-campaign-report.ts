import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../auth';

export const getCampaignReport = createAction({
  auth: mailchimpAuth,
  name: 'get_campaign_report',
  displayName: 'Get Campaign Report',
  description: 'Get detailed analytics report for a specific campaign including opens, clicks, bounces, and more',
  props: {
    campaign_id: mailchimpCommon.mailChimpCampaignIdDropdown,
    include_details: Property.Checkbox({
      displayName: 'Include Detailed Metrics',
      description: 'Include additional detailed metrics like click details and open details',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    try {
      const campaignId = context.propsValue.campaign_id!;
      const includeDetails = context.propsValue.include_details;

      // Get main campaign report
      const response = await mailchimpCommon.makeApiRequest(
        context.auth,
        `/reports/${campaignId}`
      );

      const report = response.body;

      // If detailed metrics requested, fetch additional data
      if (includeDetails) {
        try {
          // Get click details
          const clickDetailsResponse = await mailchimpCommon.makeApiRequest(
            context.auth,
            `/reports/${campaignId}/click-details`
          );
          report.click_details = clickDetailsResponse.body;

          // Get open details
          const openDetailsResponse = await mailchimpCommon.makeApiRequest(
            context.auth,
            `/reports/${campaignId}/open-details`
          );
          report.open_details = openDetailsResponse.body;
        } catch (detailError) {
          console.warn('Could not fetch detailed metrics:', detailError);
          // Continue without detailed metrics
        }
      }

      // Return structured report with key metrics highlighted
      return {
        campaign_id: report.id,
        campaign_title: report.campaign_title,
        type: report.type,
        emails_sent: report.emails_sent,
        abuse_reports: report.abuse_reports,
        unsubscribed: report.unsubscribed,
        send_time: report.send_time,
        
        // Open metrics
        opens: {
          opens_total: report.opens?.opens_total || 0,
          unique_opens: report.opens?.unique_opens || 0,
          open_rate: report.opens?.open_rate || 0,
          last_open: report.opens?.last_open,
        },
        
        // Click metrics
        clicks: {
          clicks_total: report.clicks?.clicks_total || 0,
          unique_clicks: report.clicks?.unique_clicks || 0,
          unique_subscriber_clicks: report.clicks?.unique_subscriber_clicks || 0,
          click_rate: report.clicks?.click_rate || 0,
          last_click: report.clicks?.last_click,
        },
        
        // Bounce metrics
        bounces: {
          hard_bounces: report.bounces?.hard_bounces || 0,
          soft_bounces: report.bounces?.soft_bounces || 0,
          syntax_errors: report.bounces?.syntax_errors || 0,
        },
        
        // Forward and share metrics
        forwards: {
          forwards_count: report.forwards?.forwards_count || 0,
          forwards_opens: report.forwards?.forwards_opens || 0,
        },
        
        // Industry stats comparison
        industry_stats: report.industry_stats,
        
        // List stats
        list_stats: report.list_stats,
        
        // Detailed metrics (if requested)
        ...(includeDetails && {
          click_details: report.click_details,
          open_details: report.open_details,
        }),
        
        // Full raw report for advanced users
        raw_report: report,
      };
    } catch (error) {
      throw new Error(`Failed to get campaign report: ${JSON.stringify(error)}`);
    }
  },
});
