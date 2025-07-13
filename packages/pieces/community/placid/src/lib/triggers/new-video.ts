import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { placidAuth } from '../../index';
import { PlacidWebhookPayload } from '../common';
import { templateDropdown } from '../common/props';

export const newVideo = createTrigger({
  auth: placidAuth,
  name: 'new_video',
  displayName: 'New Video',
  description: 'Fires when a video is created from a template',
  type: TriggerStrategy.WEBHOOK,
  props: {
    template: {
      ...templateDropdown,
      displayName: 'Template (Optional)',
      description: 'Filter events by a specific template. Leave empty to receive all video generation events.',
      required: false,
    },
  },
  sampleData: {
    id: 'video_123456789',
    status: 'finished',
    image_url: 'https://placid.app/generated/video.mp4',
    template_uuid: 'template_123',
    passthrough: {
      custom_data: 'example'
    }
  },
  async test(context) {
    // Return sample data for testing
    return [this.sampleData];
  },
  async onEnable(context) {
    // Store webhook URL for reference
    await context.store?.put('webhook_url', context.webhookUrl);
    
    // Placid doesn't have native webhook registration through API
    // Users need to manually configure webhooks in their Placid dashboard
    // This trigger will receive webhook payloads sent to the webhook URL
    // 
    // Webhook URL to configure in Placid: context.webhookUrl
  },
  async onDisable(context) {
    // Clean up stored webhook URL
    await context.store?.delete('webhook_url');
    
    // No additional action needed since webhooks are manually configured
  },
  async run(context) {
    // Validate webhook payload exists
    if (!context.payload?.body) {
      return [];
    }

    const payload = context.payload.body as PlacidWebhookPayload;
    const { template } = context.propsValue;

    // Validate required payload fields
    if (!payload.id || !payload.status) {
      return [];
    }

    // Filter by template if specified
    if (template && payload.template_uuid !== template) {
      return [];
    }

    // Only trigger on completed video generation events
    if (payload.status === 'finished' && payload.image_url && payload.id.startsWith('video_')) {
      // Return array as required by trigger documentation
      return [payload];
    }

    // Return empty array if conditions not met
    return [];
  },
});