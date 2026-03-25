import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { MailChimpOpenWebhookRequest } from '../common/types';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mail_chimp_email_opened_webhook_data';

type WebhookData = {
  id: string;
  listId: string;
};

const getEmailOpenEventSummary = (request: any): any => {
  const data = request.data || {};
  return {
    email: data.email || 'N/A',
    subscriber_id: data.id || 'N/A',
    list_id: data.list_id || 'N/A',
    campaign_id: data.campaign_id || 'N/A',
    ip_address: data.ip || 'N/A',
    user_agent: data.user_agent || 'N/A',
    timestamp: data.timestamp || request.fired_at || 'N/A',
    location_data: extractLocationData(data),
    device_info: extractDeviceInfo(data.user_agent),
    engagement_metrics: calculateEngagementMetrics(data),
  };
};

const extractLocationData = (data: any): any => {
  return {
    ip_address: data.ip || 'N/A',
    country: data.country || 'N/A',
    region: data.region || 'N/A',
    city: data.city || 'N/A',
    timezone: data.timezone || 'N/A',
    latitude: data.latitude || 'N/A',
    longitude: data.longitude || 'N/A',
  };
};

const extractDeviceInfo = (userAgent: string): any => {
  if (!userAgent) return { device_type: 'Unknown', browser: 'Unknown', os: 'Unknown' };
  
  const isMobile = /Mobile|Android|iPhone|iPad|Windows Phone/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent);
  
  let deviceType = 'Desktop';
  if (isTablet) deviceType = 'Tablet';
  else if (isMobile) deviceType = 'Mobile';
  
  return {
    device_type: deviceType,
    user_agent: userAgent,
    is_mobile: isMobile,
    is_tablet: isTablet,
    is_desktop: !isMobile && !isTablet,
  };
};

const calculateEngagementMetrics = (data: any): any => {
  return {
    open_count: data.open_count || 1,
    is_first_open: data.is_first_open || false,
    open_rate: data.open_rate || 0,
    engagement_score: data.member_rating || 0,
    vip_status: data.vip || false,
  };
};

const assessEngagementLevel = (data: any): string => {
  const rating = data.member_rating || 0;
  const isVip = data.vip || false;
  const openCount = data.open_count || 1;
  
  if (isVip || rating >= 4) return 'High';
  if (rating >= 2 || openCount > 1) return 'Medium';
  return 'Low';
};

const identifyAutomationOpportunities = (data: any): string[] => {
  const opportunities = [];
  
  if (data.is_first_open) {
    opportunities.push('First-time opener - welcome series opportunity');
  }
  
  if (data.member_rating && data.member_rating >= 4) {
    opportunities.push('High engagement - upsell opportunity');
  }
  
  if (data.vip) {
    opportunities.push('VIP subscriber - exclusive content opportunity');
  }
  
  return opportunities.length > 0 ? opportunities : ['Standard engagement tracking'];
};

export const mailChimpEmailOpenedTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'email_opened',
  displayName: 'Email Opened',
  description: 'Fires when a recipient opens a an email in a specific campaign',
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
  },
  sampleData: {
    type: 'open',
    fired_at: '2024-01-15T10:30:00Z',
    data: {
      id: '8a25ff1d98',
      list_id: 'a6b5da1054',
      campaign_id: 'campaign_123',
      email: 'user@example.com',
      ip: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      timestamp: '2024-01-15T10:30:00Z',
      open_count: 1,
      is_first_open: true,
      open_rate: 0.85,
      member_rating: 4,
      vip: false,
      country: 'US',
      region: 'CA',
      city: 'San Francisco',
      timezone: 'America/Los_Angeles',
      latitude: 37.7749,
      longitude: -122.4194,
    },
  },

  async onEnable(context): Promise<void> {
    try {
      const accessToken = getAccessTokenOrThrow(context.auth);
      const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

      const enabledWebhookId = await mailchimpCommon.enableWebhookRequest({
        server,
        listId: context.propsValue.list_id as string,
        token: accessToken,
        webhookUrl: context.webhookUrl!,
        events: { 
          open: true,
        },
      });

      await context.store?.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
        id: enabledWebhookId,
        listId: context.propsValue.list_id as string,
      });
    } catch (error: any) {
      throw new Error(`Failed to enable email opened webhook: ${error.message || JSON.stringify(error)}`);
    }
  },

  async onDisable(context): Promise<void> {
    try {
      const webhookData = await context.store?.get<WebhookData>(WEBHOOK_DATA_STORE_KEY);

      if (webhookData === undefined || webhookData === null) {
        return;
      }

      const token = getAccessTokenOrThrow(context.auth);
      const server = await mailchimpCommon.getMailChimpServerPrefix(token);

      await mailchimpCommon.disableWebhookRequest({
        server,
        token,
        listId: webhookData.listId,
        webhookId: webhookData.id,
      });
    } catch (error: any) {
      console.error(`Failed to disable email opened webhook: ${error.message || JSON.stringify(error)}`);
    }
  },

  async run(context): Promise<unknown[]> {
    try {
      const request = context.payload.body as MailChimpOpenWebhookRequest;

      if (!request || request.type !== 'open') {
        return [];
      }

      const enhancedRequest = {
        ...request,
        trigger_type: 'email_opened',
        event_category: 'Email Engagement',
        processed_at: new Date().toISOString(),
        open_summary: getEmailOpenEventSummary(request),
        business_context: {
          email_engagement: true,
          performance_tracking: true,
          subscriber_behavior: true,
          automation_trigger: true,
        },
        engagement_insights: {
          device_type: extractDeviceInfo(request.data?.user_agent).device_type,
          location: extractLocationData(request.data),
          engagement_level: assessEngagementLevel(request.data),
          automation_potential: identifyAutomationOpportunities(request.data),
        },
      };

      return [enhancedRequest];
    } catch (error: any) {
      console.error(`Error processing email opened webhook: ${error.message || JSON.stringify(error)}`);
      return [];
    }
  },
});
