import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mail_chimp_segment_tag_subscriber_webhook_data';

type WebhookData = {
  id: string;
  listId: string;
  segmentId?: string;
  tagName?: string;
};

const getSegmentTagEventSummary = (request: any): any => {
  const data = request.data || {};
  return {
    subscriber_id: data.id || 'N/A',
    list_id: data.list_id || 'N/A',
    email: data.email || 'N/A',
    segment_id: data.segment_id || 'N/A',
    segment_name: data.segment_name || 'N/A',
    tag_name: data.tag_name || 'N/A',
    tag_category: data.tag_category || 'N/A',
    event_type: data.event_type || 'segment_join',
    timestamp: data.timestamp || request.fired_at || 'N/A',
    merge_fields: data.merges || {},
    member_rating: data.member_rating || 0,
    vip_status: data.vip || false,
    language: data.language || 'en',
  };
};

const extractSegmentInfo = (data: any): any => {
  return {
    segment_id: data.segment_id || 'N/A',
    segment_name: data.segment_name || 'N/A',
    segment_type: data.segment_type || 'static',
    segment_match: data.segment_match || 'any',
    segment_conditions: data.segment_conditions || [],
    segment_count: data.segment_count || 0,
    segment_created: data.segment_created || 'N/A',
    segment_updated: data.segment_updated || 'N/A',
  };
};

const extractTagInfo = (data: any): any => {
  return {
    tag_name: data.tag_name || 'N/A',
    tag_category: data.tag_category || 'N/A',
    tag_color: data.tag_color || 'N/A',
    tag_count: data.tag_count || 0,
    tag_created: data.tag_created || 'N/A',
    tag_updated: data.tag_updated || 'N/A',
    tag_notes: data.tag_notes || 'N/A',
  };
};

const assessSegmentEngagement = (data: any): string => {
  const rating = data.member_rating || 0;
  const isVip = data.vip || false;
  const segmentCount = data.segment_count || 0;
  
  if (isVip || rating >= 4) return 'High Engagement';
  if (rating >= 2 || segmentCount > 1) return 'Medium Engagement';
  return 'New to Segment';
};

const identifySegmentOpportunities = (data: any): string[] => {
  const opportunities = [];
  
  if (data.event_type === 'segment_join') {
    opportunities.push('New segment member - welcome series opportunity');
  }
  
  if (data.event_type === 'tag_added') {
    opportunities.push('New tag applied - targeted content opportunity');
  }
  
  if (data.member_rating >= 4) {
    opportunities.push('High engagement - premium content opportunity');
  }
  
  if (data.vip) {
    opportunities.push('VIP member - exclusive segment opportunity');
  }
  
  if (data.segment_type === 'dynamic') {
    opportunities.push('Dynamic segment - automated targeting opportunity');
  }
  
  return opportunities.length > 0 ? opportunities : ['Standard segment engagement'];
};

const calculateSegmentMetrics = (data: any): any => {
  return {
    segment_member_count: data.segment_count || 0,
    segment_growth_rate: data.growth_rate || 0,
    segment_engagement_score: data.engagement_score || 0,
    segment_activity_level: data.activity_level || 'low',
    segment_retention_rate: data.retention_rate || 0,
    segment_conversion_rate: data.conversion_rate || 0,
  };
};

const getEventCategory = (eventType: string): string => {
  switch (eventType) {
    case 'segment':
      return 'Segment Membership';
    case 'tag':
      return 'Tag Application';
    case 'profile':
      return 'Profile Update';
    case 'subscribe':
      return 'New Subscription';
    default:
      return 'Unknown Event';
  }
};

export const mailChimpNewSegmentTagSubscriberTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'new_segment_tag_subscriber',
  displayName: 'New Segment Tag Subscriber',
  description: 'Fires when a subscriber joins a specific segment or tag',
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    segment_id: Property.ShortText({
      displayName: 'Segment ID (Optional)',
      description: 'The specific segment ID to monitor. Leave empty to monitor all segments.',
      required: false,
    }),
    tag_name: Property.ShortText({
      displayName: 'Tag Name (Optional)',
      description: 'The specific tag name to monitor. Leave empty to monitor all tags.',
      required: false,
    }),
  },
  sampleData: {
    type: 'segment_tag',
    fired_at: '2024-01-15T10:30:00Z',
    data: {
      id: '8a25ff1d98',
      list_id: 'a6b5da1054',
      email: 'subscriber@example.com',
      segment_id: 'segment_123',
      segment_name: 'High Value Customers',
      segment_type: 'static',
      segment_match: 'all',
      segment_conditions: [
        {
          condition_type: 'EmailAddress',
          op: 'is',
          field: 'EMAIL',
          value: 'subscriber@example.com',
        },
      ],
      segment_count: 150,
      segment_created: '2024-01-01T00:00:00Z',
      segment_updated: '2024-01-15T10:30:00Z',
      tag_name: 'premium',
      tag_category: 'customer_type',
      tag_color: '#FF6B6B',
      tag_count: 75,
      tag_created: '2024-01-01T00:00:00Z',
      tag_updated: '2024-01-15T10:30:00Z',
      tag_notes: 'Premium customer segment',
      event_type: 'segment_join',
      timestamp: '2024-01-15T10:30:00Z',
      merges: {
        EMAIL: 'subscriber@example.com',
        FNAME: 'John',
        LNAME: 'Doe',
        COMPANY: 'Example Corp',
        PHONE: '+1-555-0123',
        INTERESTS: 'Premium,High-Value',
      },
      member_rating: 5,
      vip: true,
      language: 'en',
      growth_rate: 0.15,
      engagement_score: 0.85,
      activity_level: 'high',
      retention_rate: 0.92,
      conversion_rate: 0.08,
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
          profile: true,
        },
      });

      await context.store?.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
        id: enabledWebhookId,
        listId: context.propsValue.list_id as string,
        segmentId: context.propsValue.segment_id,
        tagName: context.propsValue.tag_name,
      });
    } catch (error: any) {
      throw new Error(`Failed to enable segment tag subscriber webhook: ${error.message || JSON.stringify(error)}`);
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
      console.error(`Failed to disable segment tag subscriber webhook: ${error.message || JSON.stringify(error)}`);
    }
  },

  async run(context): Promise<unknown[]> {
    try {
      const request = context.payload.body as any;

      if (request === undefined || !['segment', 'tag', 'profile', 'subscribe'].includes(request.type)) {
        return [];
      }

      const webhookData = await context.store?.get<WebhookData>(WEBHOOK_DATA_STORE_KEY);
      if (webhookData) {
        if (webhookData.segmentId && request.data?.segment_id !== webhookData.segmentId) {
          return [];
        }
        if (webhookData.tagName && request.data?.tag_name !== webhookData.tagName) {
          return [];
        }
      }

      const enhancedRequest = {
        ...request,
        trigger_type: 'segment_tag_subscriber',
        event_category: getEventCategory(request.type),
        processed_at: new Date().toISOString(),
        segment_tag_summary: getSegmentTagEventSummary(request),
        business_context: {
          audience_segmentation: true,
          targeted_marketing: true,
          automation_trigger: true,
          customer_insights: true,
        },
        segment_tag_insights: {
          segment_info: extractSegmentInfo(request.data),
          tag_info: extractTagInfo(request.data),
          engagement_level: assessSegmentEngagement(request.data),
          automation_opportunities: identifySegmentOpportunities(request.data),
          segment_metrics: calculateSegmentMetrics(request.data),
        },
      };

      return [enhancedRequest];
    } catch (error: any) {
      console.error(`Error processing segment tag subscriber webhook: ${error.message || JSON.stringify(error)}`);
      return [];
    }
  },
});
