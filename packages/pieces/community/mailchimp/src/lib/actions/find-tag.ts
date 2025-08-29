import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const findTag = createAction({
  auth: mailchimpAuth,
  name: 'find_tag',
  displayName: 'Find Tag',
  description: 'Find detailed information about a specific tag including performance metrics and statistics across different time periods',
  props: {
    tag_name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to find information about',
      required: true,
    }),
  },
  async run(context) {
    const access_token = context.auth.access_token;
    const mailChimpServerPrefix = await mailchimpCommon.getMailChimpServerPrefix(access_token);
    
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://${mailChimpServerPrefix}.api.mailchimp.com/3.0/tags/info`,
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          key: access_token,
          tag: context.propsValue.tag_name,
        },
      });

      const tagInfo = response.body;

      return {
        success: true,
        found: true,
        tag: {
          name: tagInfo.tag,
          overall_stats: {
            sent: tagInfo.sent || 0,
            hard_bounces: tagInfo.hard_bounces || 0,
            soft_bounces: tagInfo.soft_bounces || 0,
            rejects: tagInfo.rejects || 0,
            complaints: tagInfo.complaints || 0,
            unsubs: tagInfo.unsubs || 0,
            opens: tagInfo.opens || 0,
            clicks: tagInfo.clicks || 0,
          },
          time_period_stats: {
            today: tagInfo.stats?.today ? {
              sent: tagInfo.stats.today.sent || 0,
              hard_bounces: tagInfo.stats.today.hard_bounces || 0,
              soft_bounces: tagInfo.stats.today.soft_bounces || 0,
              rejects: tagInfo.stats.today.rejects || 0,
              complaints: tagInfo.stats.today.complaints || 0,
              unsubs: tagInfo.stats.today.unsubs || 0,
              opens: tagInfo.stats.today.opens || 0,
              unique_opens: tagInfo.stats.today.unique_opens || 0,
              clicks: tagInfo.stats.today.clicks || 0,
              unique_clicks: tagInfo.stats.today.unique_clicks || 0,
            } : null,
            last_7_days: tagInfo.stats?.last_7_days ? {
              sent: tagInfo.stats.last_7_days.sent || 0,
              hard_bounces: tagInfo.stats.last_7_days.hard_bounces || 0,
              soft_bounces: tagInfo.stats.last_7_days.soft_bounces || 0,
              rejects: tagInfo.stats.last_7_days.rejects || 0,
              complaints: tagInfo.stats.last_7_days.complaints || 0,
              unsubs: tagInfo.stats.last_7_days.unsubs || 0,
              opens: tagInfo.stats.last_7_days.opens || 0,
              unique_opens: tagInfo.stats.last_7_days.unique_opens || 0,
              clicks: tagInfo.stats.last_7_days.clicks || 0,
              unique_clicks: tagInfo.stats.last_7_days.unique_clicks || 0,
            } : null,
            last_30_days: tagInfo.stats?.last_30_days ? {
              sent: tagInfo.stats.last_30_days.sent || 0,
              hard_bounces: tagInfo.stats.last_30_days.hard_bounces || 0,
              soft_bounces: tagInfo.stats.last_30_days.soft_bounces || 0,
              rejects: tagInfo.stats.last_30_days.rejects || 0,
              complaints: tagInfo.stats.last_30_days.complaints || 0,
              unsubs: tagInfo.stats.last_30_days.unsubs || 0,
              opens: tagInfo.stats.last_30_days.opens || 0,
              unique_opens: tagInfo.stats.last_30_days.unique_opens || 0,
              clicks: tagInfo.stats.last_30_days.clicks || 0,
              unique_clicks: tagInfo.stats.last_30_days.unique_clicks || 0,
            } : null,
            last_60_days: tagInfo.stats?.last_60_days ? {
              sent: tagInfo.stats.last_60_days.sent || 0,
              hard_bounces: tagInfo.stats.last_60_days.hard_bounces || 0,
              soft_bounces: tagInfo.stats.last_60_days.soft_bounces || 0,
              rejects: tagInfo.stats.last_60_days.rejects || 0,
              complaints: tagInfo.stats.last_60_days.complaints || 0,
              unsubs: tagInfo.stats.last_60_days.unsubs || 0,
              opens: tagInfo.stats.last_60_days.opens || 0,
              unique_opens: tagInfo.stats.last_60_days.unique_opens || 0,
              clicks: tagInfo.stats.last_60_days.clicks || 0,
              unique_clicks: tagInfo.stats.last_60_days.unique_clicks || 0,
            } : null,
            last_90_days: tagInfo.stats?.last_90_days ? {
              sent: tagInfo.stats.last_90_days.sent || 0,
              hard_bounces: tagInfo.stats.last_90_days.hard_bounces || 0,
              soft_bounces: tagInfo.stats.last_90_days.soft_bounces || 0,
              rejects: tagInfo.stats.last_90_days.rejects || 0,
              complaints: tagInfo.stats.last_90_days.complaints || 0,
              unsubs: tagInfo.stats.last_90_days.unsubs || 0,
              opens: tagInfo.stats.last_90_days.opens || 0,
              unique_opens: tagInfo.stats.last_90_days.unique_opens || 0,
              clicks: tagInfo.stats.last_90_days.clicks || 0,
              unique_clicks: tagInfo.stats.last_90_days.unique_clicks || 0,
            } : null,
          },
        },
        performance_summary: {
          total_emails: tagInfo.sent || 0,
          total_opens: tagInfo.opens || 0,
          total_clicks: tagInfo.clicks || 0,
          total_bounces: (tagInfo.hard_bounces || 0) + (tagInfo.soft_bounces || 0),
          total_rejects: tagInfo.rejects || 0,
          total_complaints: tagInfo.complaints || 0,
          total_unsubs: tagInfo.unsubs || 0,
          open_rate: tagInfo.sent > 0 ? ((tagInfo.opens || 0) / tagInfo.sent * 100) : 0,
          click_rate: tagInfo.sent > 0 ? ((tagInfo.clicks || 0) / tagInfo.sent * 100) : 0,
          bounce_rate: tagInfo.sent > 0 ? (((tagInfo.hard_bounces || 0) + (tagInfo.soft_bounces || 0)) / tagInfo.sent * 100) : 0,
          complaint_rate: tagInfo.sent > 0 ? ((tagInfo.complaints || 0) / tagInfo.sent * 100) : 0,
          unsubscribe_rate: tagInfo.sent > 0 ? ((tagInfo.unsubs || 0) / tagInfo.sent * 100) : 0,
        },
        recent_activity: {
          today: tagInfo.stats?.today ? {
            emails_sent: tagInfo.stats.today.sent || 0,
            opens: tagInfo.stats.today.opens || 0,
            unique_opens: tagInfo.stats.today.unique_opens || 0,
            clicks: tagInfo.stats.today.clicks || 0,
            unique_clicks: tagInfo.stats.today.unique_clicks || 0,
            bounces: (tagInfo.stats.today.hard_bounces || 0) + (tagInfo.stats.today.soft_bounces || 0),
            complaints: tagInfo.stats.today.complaints || 0,
            unsubs: tagInfo.stats.today.unsubs || 0,
          } : null,
          last_week: tagInfo.stats?.last_7_days ? {
            emails_sent: tagInfo.stats.last_7_days.sent || 0,
            opens: tagInfo.stats.last_7_days.opens || 0,
            unique_opens: tagInfo.stats.last_7_days.unique_opens || 0,
            clicks: tagInfo.stats.last_7_days.clicks || 0,
            unique_clicks: tagInfo.stats.last_7_days.unique_clicks || 0,
            bounces: (tagInfo.stats.last_7_days.hard_bounces || 0) + (tagInfo.stats.last_7_days.soft_bounces || 0),
            complaints: tagInfo.stats.last_7_days.complaints || 0,
            unsubs: tagInfo.stats.last_7_days.unsubs || 0,
          } : null,
          last_month: tagInfo.stats?.last_30_days ? {
            emails_sent: tagInfo.stats.last_30_days.sent || 0,
            opens: tagInfo.stats.last_30_days.opens || 0,
            unique_opens: tagInfo.stats.last_30_days.unique_opens || 0,
            clicks: tagInfo.stats.last_30_days.clicks || 0,
            unique_clicks: tagInfo.stats.last_30_days.unique_clicks || 0,
            bounces: (tagInfo.stats.last_30_days.hard_bounces || 0) + (tagInfo.stats.last_30_days.soft_bounces || 0),
            complaints: tagInfo.stats.last_30_days.complaints || 0,
            unsubs: tagInfo.stats.last_30_days.unsubs || 0,
          } : null,
        },
        raw_data: tagInfo,
      };
    } catch (error: any) {
      if (error.status === 404) {
        return {
          success: false,
          found: false,
          error: 'Tag not found',
          message: `The tag "${context.propsValue.tag_name}" could not be found. Make sure the tag name is correct and exists in your Mailchimp account.`,
        };
      }
      
      throw new Error(`Failed to find tag: ${error.message || JSON.stringify(error)}`);
    }
  },
});
