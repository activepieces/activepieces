import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient, CampaignReportOptions } from '../common/types';

export const getCampaignReport = createAction({
  auth: mailchimpAuth,
  name: 'get_campaign_report',
  displayName: 'Get Campaign Report',
  description: 'Get comprehensive report details for a specific sent campaign including opens, clicks, bounces, and performance metrics',
  props: {
    campaign_id: mailchimpCommon.mailChimpCampaignIdDropdown,
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
      
      if (context.propsValue.fields && context.propsValue.fields.trim()) {
        options.fields = context.propsValue.fields.trim();
      }
      
      if (context.propsValue.exclude_fields && context.propsValue.exclude_fields.trim()) {
        options.exclude_fields = context.propsValue.exclude_fields.trim();
      }

      const report = await client.reports.getCampaignReport(context.propsValue.campaign_id!, options);

      return {
        success: true,
        report: {
          id: report.id,
          campaign_title: report.campaign_title,
          type: report.type,
          list_id: report.list_id,
          list_is_active: report.list_is_active,
          list_name: report.list_name,
          subject_line: report.subject_line,
          preview_text: report.preview_text,
          emails_sent: report.emails_sent,
          abuse_reports: report.abuse_reports,
          unsubscribed: report.unsubscribed,
          send_time: report.send_time,
          rss_last_send: report.rss_last_send,
          bounces: report.bounces,
          forwards: report.forwards,
          opens: report.opens,
          clicks: report.clicks,
          facebook_likes: report.facebook_likes,
          industry_stats: report.industry_stats,
          list_stats: report.list_stats,
          ab_split: report.ab_split,
          timewarp: report.timewarp,
          timeseries: report.timeseries,
          share_report: report.share_report,
          ecommerce: report.ecommerce,
          delivery_status: report.delivery_status,
          _links: report._links,
        },
        summary: {
          campaign_title: report.campaign_title,
          subject_line: report.subject_line,
          emails_sent: report.emails_sent,
          unique_opens: report.opens?.unique_opens || 0,
          unique_clicks: report.clicks?.unique_clicks || 0,
          open_rate: report.opens?.open_rate || 0,
          click_rate: report.clicks?.click_rate || 0,
          bounce_rate: report.bounces ? ((report.bounces.hard_bounces + report.bounces.soft_bounces) / report.emails_sent * 100) : 0,
          unsub_rate: report.unsubscribed ? (report.unsubscribed / report.emails_sent * 100) : 0,
          abuse_rate: report.abuse_reports ? (report.abuse_reports / report.emails_sent * 100) : 0,
        },
        performance_metrics: {
          opens: {
            total: report.opens?.opens_total || 0,
            unique: report.opens?.unique_opens || 0,
            rate: report.opens?.open_rate || 0,
            last_open: report.opens?.last_open,
            proxy_excluded: {
              total: report.opens?.proxy_excluded_opens || 0,
              unique: report.opens?.proxy_excluded_unique_opens || 0,
              rate: report.opens?.proxy_excluded_open_rate || 0,
            },
          },
          clicks: {
            total: report.clicks?.clicks_total || 0,
            unique: report.clicks?.unique_clicks || 0,
            unique_subscribers: report.clicks?.unique_subscriber_clicks || 0,
            rate: report.clicks?.click_rate || 0,
            last_click: report.clicks?.last_click,
          },
          bounces: {
            hard: report.bounces?.hard_bounces || 0,
            soft: report.bounces?.soft_bounces || 0,
            syntax_errors: report.bounces?.syntax_errors || 0,
            total: (report.bounces?.hard_bounces || 0) + (report.bounces?.soft_bounces || 0) + (report.bounces?.syntax_errors || 0),
          },
          engagement: {
            forwards: {
              count: report.forwards?.forwards_count || 0,
              opens: report.forwards?.forwards_opens || 0,
            },
            facebook_likes: {
              recipient_likes: report.facebook_likes?.recipient_likes || 0,
              unique_likes: report.facebook_likes?.unique_likes || 0,
              facebook_likes: report.facebook_likes?.facebook_likes || 0,
            },
          },
        },
        industry_comparison: report.industry_stats ? {
          industry_type: report.industry_stats.type,
          open_rate: report.industry_stats.open_rate,
          click_rate: report.industry_stats.click_rate,
          bounce_rate: report.industry_stats.bounce_rate,
          unopen_rate: report.industry_stats.unopen_rate,
          unsub_rate: report.industry_stats.unsub_rate,
          abuse_rate: report.industry_stats.abuse_rate,
        } : null,
        list_performance: report.list_stats ? {
          subscription_rate: report.list_stats.sub_rate,
          unsubscription_rate: report.list_stats.unsub_rate,
          open_rate: report.list_stats.open_rate,
          proxy_excluded_open_rate: report.list_stats.proxy_excluded_open_rate,
          click_rate: report.list_stats.click_rate,
        } : null,
        ecommerce_data: report.ecommerce ? {
          total_orders: report.ecommerce.total_orders,
          total_spent: report.ecommerce.total_spent,
          total_revenue: report.ecommerce.total_revenue,
          currency_code: report.ecommerce.currency_code,
        } : null,
        delivery_status: report.delivery_status ? {
          enabled: report.delivery_status.enabled,
          can_cancel: report.delivery_status.can_cancel,
          status: report.delivery_status.status,
          emails_sent: report.delivery_status.emails_sent,
          emails_canceled: report.delivery_status.emails_canceled,
        } : null,
        ab_split_data: report.ab_split ? {
          group_a: {
            bounces: report.ab_split.a?.bounces || 0,
            abuse_reports: report.ab_split.a?.abuse_reports || 0,
            unsubs: report.ab_split.a?.unsubs || 0,
            recipient_clicks: report.ab_split.a?.recipient_clicks || 0,
            forwards: report.ab_split.a?.forwards || 0,
            forwards_opens: report.ab_split.a?.forwards_opens || 0,
            opens: report.ab_split.a?.opens || 0,
            last_open: report.ab_split.a?.last_open,
            unique_opens: report.ab_split.a?.unique_opens || 0,
          },
          group_b: {
            bounces: report.ab_split.b?.bounces || 0,
            abuse_reports: report.ab_split.b?.abuse_reports || 0,
            unsubs: report.ab_split.b?.unsubs || 0,
            recipient_clicks: report.ab_split.b?.recipient_clicks || 0,
            forwards: report.ab_split.b?.forwards || 0,
            forwards_opens: report.ab_split.b?.forwards_opens || 0,
            opens: report.ab_split.b?.opens || 0,
            last_open: report.ab_split.b?.last_open,
            unique_opens: report.ab_split.b?.unique_opens || 0,
          },
        } : null,
        timewarp_data: report.timewarp || [],
        timeseries_data: report.timeseries || [],
        share_report: report.share_report ? {
          share_url: report.share_report.share_url,
          share_password: report.share_report.share_password,
        } : null,
      };
    } catch (error: any) {
      if (error.status === 404) {
        return {
          success: false,
          error: 'Campaign report not found',
          message: 'The requested campaign report could not be found. Make sure the campaign has been sent and the campaign ID is correct.',
          detail: error.detail || 'The requested resource could not be found',
        };
      }
      
      throw new Error(`Failed to get campaign report: ${error.message || JSON.stringify(error)}`);
    }
  },
});
