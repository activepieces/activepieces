import { clickfunnelsAuth } from '../common/auth';
import { clickfunnelsCommon } from '../common/client';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';

export const contactIdentified = createTrigger({
  name: 'contact_identified',
  displayName: 'Contact Identified',
  description: 'Fires when a new contact is identified by email/phone',
  auth: clickfunnelsAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 46,
    public_id: "lYcaPW",
    workspace_id: 42000,
    anonymous: null,
    email_address: "test-3307abad872766655805@example.com",
    first_name: "Wade",
    last_name: "Stamm",
    phone_number: "403-064-5003",
    time_zone: "Pacific Time (US & Canada)",
    uuid: "c9b4e8b8-b106-4aaf-858e-e7aab5a94590",
    unsubscribed_at: null,
    last_notification_email_sent_at: null,
    fb_url: "https://www.facebook.com/example",
    twitter_url: "https://twitter.com/example",
    instagram_url: null,
    linkedin_url: "https://www.linkedin.com/in/example",
    website_url: "https://example.com",
    created_at: "2025-06-16T20:25:34.647Z",
    updated_at: "2025-06-16T20:25:34.647Z",
    tags: [
      {
        id: 48,
        public_id: "XdxpIl",
        name: "Example Tag",
        color: "#768679",
        applied_at: null
      }
    ],
    custom_attributes: {},
    avatar_image: {}
  },

  onEnable: async (context) => {
    const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
    const webhookUrl = context.webhookUrl;
    
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://${subdomain}.myclickfunnels.com/api/v2/webhooks/outgoing/endpoints`,
      body: {
        endpoint: {
          name: 'Activepieces Contact Identified',
          url: webhookUrl,
          event_type_ids: ['contacts.created']
        }
      },
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await httpClient.sendRequest(request);
    if (response.status !== 201) {
      throw new Error(`Failed to register webhook. Status: ${response.status}`);
    }

    const webhookId = response.body.data?.id || response.body.id;
    await context.store?.put('webhookId', webhookId);
  },

  onDisable: async (context) => {
    const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
    const webhookId = await context.store?.get('webhookId');
    
    if (!webhookId) {
      return;
    }

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `https://${subdomain}.myclickfunnels.com/api/v2/webhooks/outgoing/endpoints/${webhookId}`,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
      },
    };

    try {
      await httpClient.sendRequest(request);
    } catch (error) {
      console.warn('Failed to unregister webhook:', error);
    }
  },

  run: async (context) => {
    const payload = context.payload.body as any;
    
    if (payload?.data) {
      const contactData = payload.data;
      // Validate that this is a contact with required fields
      if (contactData.id && contactData.uuid && (contactData.email_address || contactData.phone_number)) {
        return [contactData];
      }
    }
    
    // Fallback for direct contact structure
    if (payload && payload.id && payload.uuid && (payload.email_address || payload.phone_number)) {
      return [payload];
    }
    
    return [];
  },
});
