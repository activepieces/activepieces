import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../auth';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient, CampaignReportOptions } from '../common/types';

export const getCampaignReport = createAction({
  auth: mailchimpAuth,
  name: 'get_campaign_report',
  displayName: 'Get Campaign Report',
  description: 'Get analytics report for a specific campaign including opens, clicks, bounces, and more.',
  props: {
    campaign_id: mailchimpCommon.mailChimpCampaignIdDropdown,
    include_details: Property.Checkbox({
      displayName: 'Include Detailed Metrics',
      description: 'Include click details and open details',
      required: false,
      defaultValue: false,
    }),
    fields: Property.LongText({
      displayName: 'Include Fields',
      description: 'Comma-separated list of fields to return (e.g., "opens.unique_opens,clicks.click_rate")',
      required: false,
    }),
    exclude_fields: Property.LongText({
      displayName: 'Exclude Fields',
      description: 'Comma-separated list of fields to exclude (e.g., "timeseries,_links")',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

    const client = mailchimp as unknown as MailchimpClient;
    client.setConfig({
      accessToken: accessToken,
      server: server,
    });

    try {
      const options: CampaignReportOptions = {};
      if (context.propsValue.fields?.trim()) {
        options.fields = context.propsValue.fields.trim();
      }
      if (context.propsValue.exclude_fields?.trim()) {
        options.exclude_fields = context.propsValue.exclude_fields.trim();
      }

      const report = await client.reports.getCampaignReport(
        context.propsValue.campaign_id!,
        options
      );

      // If extra details requested, call sub-endpoints
      if (context.propsValue.include_details) {
        try {
          const clickDetailsResponse = await mailchimpCommon.makeApiRequest(
            context.auth,
            `/reports/${context.propsValue.campaign_id}/click-details`
          );
          const openDetailsResponse = await mailchimpCommon.makeApiRequest(
            context.auth,
            `/reports/${context.propsValue.campaign_id}/open-details`
          );
          (report as any).click_details = clickDetailsResponse.body;
          (report as any).open_details = openDetailsResponse.body;
        } catch (detailError) {
          console.warn('Could not fetch detailed metrics:', detailError);
        }
      }

      return {
        success: true,
        campaign_id: report.id,
        campaign_title: report.campaign_title,
        subject_line: report.subject_line,
        type: report.type,
        emails_sent: report.emails_sent,
        abuse_reports: report.abuse_reports,
        unsubscribed: report.unsubscribed,
        send_time: report.send_time,

        // Open metrics
        opens: {
          total: report.opens?.opens_total || 0,
          unique: report.opens?.unique_opens || 0,
          rate: report.opens?.open_rate || 0,
          last_open: report.opens?.last_open,
        },

        // Click metrics
        clicks: {
          total: report.clicks?.clicks_total || 0,
          unique: report.clicks?.unique_clicks || 0,
          unique_subscribers: report.clicks?.unique_subscriber_clicks || 0,
          rate: report.clicks?.click_rate || 0,
          last_click: report.clicks?.last_click,
        },

        // Bounce metrics
        bounces: {
          hard: report.bounces?.hard_bounces || 0,
          soft: report.bounces?.soft_bounces || 0,
          syntax_errors: report.bounces?.syntax_errors || 0,
        },

        // Forward/share metrics
        forwards: {
          count: report.forwards?.forwards_count || 0,
          opens: report.forwards?.forwards_opens || 0,
        },

        // Comparison
        industry_stats: report.industry_stats,
        list_stats: report.list_stats,

        // Extra details if requested
        ...(context.propsValue.include_details && {
          click_details: (report as any).click_details,
          open_details: (report as any).open_details,
        }),

        // Raw report for advanced usage
        raw_report: report,
      };
    } catch (error: any) {
      if (error.status === 404) {
        return {
          success: false,
          error: 'Campaign report not found',
          message:
            'The requested campaign report could not be found. Make sure the campaign has been sent and the campaign ID is correct.',
          detail: error.detail || 'The requested resource could not be found',
        };
      }

      throw new Error(
        `Failed to get campaign report: ${error.message || JSON.stringify(error)}`
      );
    }
  },
});
