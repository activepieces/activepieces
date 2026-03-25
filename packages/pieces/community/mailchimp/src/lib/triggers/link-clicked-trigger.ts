import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { MailChimpClickWebhookRequest } from '../common/types';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mail_chimp_link_clicked_webhook_data';

type WebhookData = {
  id: string;
  listId: string;
};

const getLinkClickEventSummary = (request: MailChimpClickWebhookRequest): any => {
  const data = request.data || {};
  return {
    email: data.email || 'N/A',
    subscriber_id: data.id || 'N/A',
    list_id: data.list_id || 'N/A',
    campaign_id: data.campaign_id || 'N/A',
    url: data.url || 'N/A',
    ip_address: data.ip || 'N/A',
    user_agent: data.user_agent || 'N/A',
    timestamp: data.timestamp || request.fired_at || 'N/A',
    click_data: {
      url: data.url || 'N/A',
      link_id: data.link_id || 'N/A',
      click_count: data.click_count || 1,
      is_first_click: data.is_first_click || false,
    },
    location_data: extractLocationData(data),
    device_info: extractDeviceInfo(data.user_agent),
    engagement_metrics: calculateClickMetrics(data),
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

const calculateClickMetrics = (data: any): any => {
  return {
    click_count: data.click_count || 1,
    is_first_click: data.is_first_click || false,
    click_rate: data.click_rate || 0,
    engagement_score: data.member_rating || 0,
    vip_status: data.vip || false,
    link_engagement: data.url ? 'High' : 'Low',
  };
};

const assessClickEngagementLevel = (data: any): string => {
  const rating = data.member_rating || 0;
  const isVip = data.vip || false;
  const clickCount = data.click_count || 1;
  
  if (isVip || rating >= 4) return 'High';
  if (rating >= 2 || clickCount > 1) return 'Medium';
  return 'Low';
};

const identifyClickAutomationOpportunities = (data: any): string[] => {
  const opportunities = [];
  
  if (data.is_first_click) {
    opportunities.push('First-time clicker - conversion funnel opportunity');
  }
  
  if (data.member_rating && data.member_rating >= 4) {
    opportunities.push('High engagement - product recommendation opportunity');
  }
  
  if (data.vip) {
    opportunities.push('VIP subscriber - exclusive offer opportunity');
  }
  
  if (data.url && data.url.includes('product')) {
    opportunities.push('Product page click - purchase intent opportunity');
  }
  
  return opportunities.length > 0 ? opportunities : ['Standard click tracking'];
};

const assessConversionPotential = (data: any): string => {
  if (data.url?.includes('product') || data.url?.includes('shop')) {
    return 'High - Product page engagement';
  }
  if (data.url?.includes('checkout') || data.url?.includes('cart')) {
    return 'Very High - Purchase intent';
  }
  if (data.url?.includes('signup') || data.url?.includes('register')) {
    return 'High - Registration intent';
  }
  return 'Medium - General engagement';
};

export const mailChimpLinkClickedTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'link_clicked',
  displayName: 'Link Clicked',
  description: 'Fires when a recipient clicks a specified link in a campaign',
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
  },
  sampleData: {
    type: 'click',
    fired_at: '2024-01-15T10:30:00Z',
    data: {
      id: '8a25ff1d98',
      list_id: 'a6b5da1054',
      campaign_id: 'campaign_123',
      email: 'user@example.com',
      url: 'https://example.com/product-page',
      link_id: 'link_456',
      ip: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      timestamp: '2024-01-15T10:30:00Z',
      click_count: 1,
      is_first_click: true,
      click_rate: 0.25,
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
          click: true,
        },
      });

      await context.store?.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
        id: enabledWebhookId,
        listId: context.propsValue.list_id as string,
      });
    } catch (error: any) {
      throw new Error(`Failed to enable link clicked webhook: ${error.message || JSON.stringify(error)}`);
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
      console.error(`Failed to disable link clicked webhook: ${error.message || JSON.stringify(error)}`);
    }
  },

  async run(context): Promise<unknown[]> {
    try {
      const request = context.payload.body as MailChimpClickWebhookRequest;

      if (!request || request.type !== 'click') {
        return [];
      }

      const enhancedRequest = {
        ...request,
        trigger_type: 'link_clicked',
        event_category: 'Link Engagement',
        processed_at: new Date().toISOString(),
        click_summary: getLinkClickEventSummary(request),
        business_context: {
          link_engagement: true,
          conversion_tracking: true,
          subscriber_behavior: true,
          automation_trigger: true,
        },
        click_insights: {
          device_type: extractDeviceInfo(request.data?.user_agent).device_type,
          location: extractLocationData(request.data),
          engagement_level: assessClickEngagementLevel(request.data),
          automation_potential: identifyClickAutomationOpportunities(request.data),
          conversion_opportunity: assessConversionPotential(request.data),
        },
      };

      return [enhancedRequest];
    } catch (error: any) {
      console.error(`Error processing link clicked webhook: ${error.message || JSON.stringify(error)}`);
      return [];
    }
  },
});
