import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mail_chimp_unsubscribe_webhook_data';

type WebhookData = {
  id: string;
  listId: string;
};

const getUnsubscribeEventSummary = (request: any): any => {
  const data = request.data || {};
  return {
    email: data.email || 'N/A',
    subscriber_id: data.id || 'N/A',
    list_id: data.list_id || 'N/A',
    email_type: data.email_type || 'html',
    ip_address: data.ip_opt || data.ip_signup || 'N/A',
    signup_timestamp: data.timestamp_signup || 'N/A',
    opt_in_timestamp: data.timestamp_opt || 'N/A',
    unsubscribe_timestamp: request.fired_at || 'N/A',
    has_merge_fields: !!data.merges,
    merge_field_count: data.merges ? Object.keys(data.merges).length : 0,
    merge_fields_summary: data.merges ? {
      first_name: data.merges.FNAME || 'N/A',
      last_name: data.merges.LNAME || 'N/A',
      company: data.merges.COMPANY || 'N/A',
      phone: data.merges.PHONE || 'N/A',
      interests: data.merges.INTERESTS || 'N/A',
      has_address: !!data.merges.ADDRESS,
    } : null,
    member_rating: data.member_rating || 0,
    vip_status: data.vip ? 'VIP' : 'Standard',
    language: data.language || 'en',
  };
};

const calculateSubscriberLifetime = (request: any): string => {
  const data = request.data || {};
  const signupTime = data.timestamp_signup ? new Date(data.timestamp_signup) : null;
  const unsubscribeTime = request.fired_at ? new Date(request.fired_at) : null;
  
  if (signupTime && unsubscribeTime) {
    const diffTime = Math.abs(unsubscribeTime.getTime() - signupTime.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  }
  return 'Unknown';
};

const assessEngagementLevel = (request: any): string => {
  const data = request.data || {};
  const rating = data.member_rating || 0;
  
  if (rating >= 4) return 'High';
  if (rating >= 2) return 'Medium';
  return 'Low';
};

const identifyChurnFactors = (request: any): string[] => {
  const factors = [];
  const data = request.data || {};
  
  if (data.member_rating && data.member_rating < 3) {
    factors.push('Low engagement rating');
  }
  
  if (request.unsubscribe_reason) {
    factors.push(`Reason: ${request.unsubscribe_reason}`);
  }
  
  if (request.campaign_id) {
    factors.push('Campaign-specific unsubscribe');
  }
  
  return factors.length > 0 ? factors : ['No specific factors identified'];
};

export const mailChimpUnsubscriberTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'unsubscribe',
  displayName: 'Member Unsubscribed from Audience',
  description: 'Fires when a subscriber unsubscribes from your Mailchimp audience. This trigger captures unsubscribe events, opt-outs, and audience churn with comprehensive subscriber information for retention analysis.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
  },
  sampleData: {
    type: 'unsubscribe',
    fired_at: '2024-01-15T10:30:00Z',
    data: {
      id: '8a25ff1d98',
      list_id: 'a6b5da1054',
      email: 'api@mailchimp.com',
      email_type: 'html',
      ip_opt: '192.168.1.100',
      ip_signup: '192.168.1.100',
      timestamp_signup: '2024-01-01T09:00:00Z',
      timestamp_opt: '2024-01-01T09:00:00Z',
      merges: {
        EMAIL: 'api@mailchimp.com',
        FNAME: 'Mailchimp',
        LNAME: 'API',
        COMPANY: 'Mailchimp Inc',
        PHONE: '+1-555-0123',
        INTERESTS: 'Group1,Group2',
        ADDRESS: {
          addr1: '675 Ponce de Leon Ave NE',
          addr2: 'Suite 5000',
          city: 'Atlanta',
          state: 'GA',
          zip: '30308',
          country: 'US',
        },
      },
      member_rating: 3,
      vip: false,
      language: 'en',
      source: 'api',
      tags: ['api-signup', 'churned-subscriber'],
      unsubscribe_reason: 'too_many_emails',
      campaign_id: 'campaign_123',
      campaign_title: 'Weekly Newsletter',
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
          unsubscribe: true,
          profile: true,
        },
      });

      await context.store?.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
        id: enabledWebhookId,
        listId: context.propsValue.list_id as string,
      });
    } catch (error: any) {
      throw new Error(`Failed to enable unsubscribe webhook: ${error.message || JSON.stringify(error)}`);
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
      console.error(`Failed to disable unsubscribe webhook: ${error.message || JSON.stringify(error)}`);
    }
  },

  async run(context): Promise<unknown[]> {
    try {
      const request = context.payload.body as any;

      if (request === undefined || request.type !== 'unsubscribe') {
        return [];
      }

      const enhancedRequest = {
        ...request,
        trigger_type: 'member_unsubscribed',
        event_category: 'Unsubscribe Event',
        processed_at: new Date().toISOString(),
        unsubscribe_summary: getUnsubscribeEventSummary(request),
        business_context: {
          audience_churn: true,
          retention_concern: true,
          feedback_opportunity: true,
          re_engagement_potential: 'medium',
        },
        retention_insights: {
          subscriber_lifetime: calculateSubscriberLifetime(request),
          engagement_level: assessEngagementLevel(request),
          churn_risk_factors: identifyChurnFactors(request),
        },
      };

      return [enhancedRequest];
    } catch (error: any) {
      console.error(`Error processing unsubscribe webhook: ${error.message || JSON.stringify(error)}`);
      return [];
    }
  },
});
